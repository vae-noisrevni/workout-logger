const assert=require('node:assert/strict');
const test=require('node:test');
const {QueryClient,QueryObserver}=require('@tanstack/react-query');
const {harness}=require('./helpers/database.cjs');
const makeClient=()=>new QueryClient({defaultOptions:{queries:{networkMode:'always',retry:false,gcTime:0},mutations:{networkMode:'always',retry:false}}});

test('Мутации пресетов обновляют два активных потребителя без перезахода',async()=>{
    const h=harness(),client=makeClient();const unsubs=[];
    try{
        await h.load('src/db/init').initializeDatabase();
        const {exerciseService,presetService}=h.load('src/services/data');
        const id=await exerciseService.create({name:'Турник',type:'bodyweight',description:'',color:'#112233',is_favorite:false});
        const {writeOptions}=h.load('src/query/operations');
        const query={queryKey:['presets'],queryFn:()=>presetService.list()};
        const a=new QueryObserver(client,query),b=new QueryObserver(client,query);
        unsubs.push(a.subscribe(()=>{}),b.subscribe(()=>{}));await client.fetchQuery(query);
        const run=(fn,input)=>client.getMutationCache().build(client,writeOptions(client,fn,[['presets']])).execute(input);
        await run(presetService.save,{name:'Понедельник',exercises:[{exercise_id:id,sets:[{reps:6,weight:10}]}]});
        assert.equal(a.getCurrentResult().data[0].name,'Понедельник');assert.equal(b.getCurrentResult().data.length,1);
        const preset=a.getCurrentResult().data[0];
        await run(presetService.save,{...preset,name:'Среда',exercises:[{exercise_id:id,sets:[{reps:6,weight:20}]}]});
        assert.equal(b.getCurrentResult().data[0].name,'Среда');
        assert.deepEqual(b.getCurrentResult().data[0].exercises[0].sets,[{reps:6,weight:20}]);
        await run(presetService.remove,preset.id);
        assert.equal(a.getCurrentResult().data.length,0);assert.equal(b.getCurrentResult().data.length,0);
    }finally{unsubs.forEach(fn=>fn());client.clear();h.sqlite.close();}
});

test('Общий бэкап сохраняет связи дублей, комментарии, планы и замеры; сбой полностью откатывает замену',async()=>{
    const h=harness();
    try{
        await h.load('src/db/init').initializeDatabase();
        const {exerciseService,presetService,workoutService,bodyWeightService}=h.load('src/services/data');
        const id1=await exerciseService.create({name:'Турник',type:'bodyweight',description:'Первый',color:'#112233',is_favorite:true});
        const id2=await exerciseService.create({name:'Турник',type:'bodyweight',description:'Второй',color:'#445566',is_favorite:false});
        await presetService.save({name:'План',exercises:[{exercise_id:id2,sets:[{reps:6,weight:10},{reps:8,weight:5}]}]});
        const preset=(await presetService.list())[0];
        await workoutService.save({input:{name:'Занятие',date:'2026.02.23',comment:'Точно',preset_id:preset.id,preset_name:'План',exercises:[{exercise_id:id2,comment:'С диском\nПлавно',sets:[{reps:6,weight:10}]}]}});
        const {parseWorkouts}=h.load('src/utils/importHistory');
        const legacy=JSON.stringify([{name:'Из истории',date:'2026-02-22',exercises:[
            {name:'Турник',comment:'До отдыха',sets:[{reps:12,weight:0}]},
            {name:'Турник',comment:'После отдыха',sets:[{reps:5,weight:2.125}]},
        ]}]);
        await workoutService.import(parseWorkouts(legacy,'json'));
        await bodyWeightService.save({date:'23.02.2026',weight:78.65});
        const transfer=h.load('src/services/transfer').transferService;
        const original=await transfer.export('workout-logger-backup');
        const source=JSON.stringify(original);await transfer.restore(source);
        const restored=await transfer.export('workout-logger-backup');
        const canonical=file=>({...file,exportedAt:'',workouts:file.workouts.map(w=>({...w,date:h.load('src/utils/date').dateKey(w.date)}))});
        assert.deepEqual(canonical(restored),canonical(original));
        assert.equal(restored.workouts[0].exercises[0].exercise_id,id2);assert.equal(restored.exercises.length,2);
        h.sqlite.exec(`CREATE TRIGGER fail_restore BEFORE INSERT ON exercises WHEN NEW.description='Второй' BEGIN SELECT RAISE(ABORT,'Сбой восстановления'); END;`);
        await assert.rejects(()=>transfer.restore(source),/Сбой восстановления/);
        h.sqlite.exec('DROP TRIGGER fail_restore');
        assert.deepEqual(canonical(await transfer.export('workout-logger-backup')),canonical(original));
        const {draftFromPreset}=h.load('src/utils/draft');
        assert.equal(draftFromPreset(preset,true).draft[0].sets.length,0);
        assert.equal(draftFromPreset(preset,false).draft[0].sets[0].weight,10);
        assert.deepEqual(h.sqlite.prepare('PRAGMA foreign_key_check').all(),[]);
    }finally{h.sqlite.close();}
});

test('Отдельный перенос пресета создаёт упражнения, повтор безопасен, конфликты не пишут данные',async()=>{
    const h=harness();
    try{
        await h.load('src/db/init').initializeDatabase();const transfer=h.load('src/services/transfer').transferService;
        await assert.rejects(()=>transfer.export('workout-logger-presets'),/хотя бы один активный пресет/);
        const input={kind:'workout-logger-presets',version:1,exportedAt:new Date().toISOString(),exercises:[{id:9,name:'Жим',type:'weighted',description:'',color:'#112233',is_favorite:true,weight_unit:'kg'}],
            presets:[{id:7,name:'Пятница',exercises:[{exercise_id:9,sets:[{reps:10,weight:40}]}]}]};
        assert.deepEqual(await transfer.importPresets(JSON.stringify(input)),{added:1,skipped:0});
        const exported=await transfer.export('workout-logger-presets');
        assert.deepEqual(await transfer.importPresets(JSON.stringify(exported)),{added:0,skipped:1});
        input.presets[0].exercises[0].sets[0].weight=50;
        await assert.rejects(()=>transfer.importPresets(JSON.stringify(input)),/другим планом/);
        const before=await transfer.export('workout-logger-backup');
        await h.load('src/services/data').exerciseService.create({name:'Жим',type:'weighted',description:'Дубль',color:'#112233',is_favorite:false});
        await assert.rejects(()=>transfer.importPresets(JSON.stringify(input)),/Неоднозначное упражнение/);
        const {exerciseService,presetService}=h.load('src/services/data');
        const [preset]=await presetService.list();
        assert.equal(preset.exercises[0].sets[0].weight,40);
        assert.equal(before.presets.length,1);
        const conflictingId=await presetService.save({name:'пятница',exercises:preset.exercises});
        await assert.rejects(()=>transfer.export('workout-logger-presets'),/повтор названия пресета/i);
        await presetService.remove(conflictingId);
        await exerciseService.remove(preset.exercise_ids[0]);
        await assert.rejects(()=>transfer.export('workout-logger-presets'),/в пресете «Пятница» нет упражнений/);
    }finally{h.sqlite.close();}
});

test('Чтение ждёт окончания транзакции и видит состояние после отката',async()=>{
    const h=harness();
    const gate=Promise.withResolvers();
    try {
        await h.load('src/db/init').initializeDatabase();
        const {databaseApi}=h.load('src/db/api');
        const inserted=Promise.withResolvers();
        const write=databaseApi.transaction(async db=>{
            await db.runAsync('INSERT INTO body_weight_entries(date,weight_kg) VALUES(?,?)',['2026-02-23',78.65]);
            inserted.resolve();
            await gate.promise;
            throw new Error('Сбой записи');
        });
        const rolledBack=assert.rejects(write,/Сбой записи/);
        await Promise.race([inserted.promise,write]);
        const read=databaseApi.all('SELECT weight_kg FROM body_weight_entries');
        await Promise.resolve();
        gate.resolve();
        await rolledBack;
        assert.deepEqual(await read,[]);
    } finally {
        gate.resolve();
        h.sqlite.close();
    }
});

test('Даты и утяжеление: строгий разбор, локальный день и прогресс при равном весе',()=>{
    const h=harness();try{
        const dates=h.load('src/utils/date');
        for(const value of ['23.02.2026','2026.02.23','2026-02-23'])assert.equal(dates.formatWorkoutDate(value),'23.02.2026');
        assert.equal(dates.formatWorkoutDate('2026-02-22T21:00:00.000Z'),'23.02.2026');
        for(const invalid of ['31.02.2026','2105235+3T2323','2026-02-31T10:00:00Z'])assert.equal(dates.resolveDate(invalid),null);
        assert.equal(dates.maskDate('23022026'),'23.02.2026');
        const stats=h.load('src/utils/stats');
        assert.equal(stats.bestSet('bodyweight',[{reps:15,weight:0},{reps:6,weight:10}]).weight,10);
        const progress=stats.exerciseProgress('bodyweight',[{date:'2026.01.23',reps:5,weight:10},{date:'23.02.2026',reps:6,weight:10}]);
        assert.equal(progress.improved,true);assert.equal(progress.repsDiff,1);
        assert.equal(stats.additionalVolume([{reps:6,weight:10},{reps:8,weight:5}]),100);
    }finally{h.sqlite.close();}
});
