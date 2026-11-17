// Даты из файлов разбираем явно: Date.parse не должен переносить 31 февраля в март.
export function resolveDate(value: string): Date | null {
    const text=value.trim();
    let year:number,month:number,day:number;
    const ymd=/^(\d{4})[-.](\d{2})[-.](\d{2})$/.exec(text);
    const dmy=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
    const iso=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.exec(text);
    if(ymd){year=+ymd[1];month=+ymd[2];day=+ymd[3];}
    else if(dmy){year=+dmy[3];month=+dmy[2];day=+dmy[1];}
    else if(iso){year=+iso[1];month=+iso[2];day=+iso[3];}
    else return null;
    const date=new Date(0);date.setHours(0,0,0,0);date.setFullYear(year,month-1,day);
    if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day) return null;
    if(iso){
        if(+iso[4]>23||+iso[5]>59||+(iso[6]??0)>59) return null;
        if(iso[7]!=='Z' && (+iso[7].slice(1,3)>23||+iso[7].slice(4)>59)) return null;
        const timestamp=new Date(text); return Number.isFinite(timestamp.getTime())?timestamp:null;
    }
    return date;
}
const pad=(n:number)=>String(n).padStart(2,'0');
export function dateKey(value:string):string {const date=resolveDate(value);return date?`${String(date.getFullYear()).padStart(4,'0')}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`:'';}
export function formatWorkoutDate(value:string):string {const key=dateKey(value);return key?`${key.slice(8)}.${key.slice(5,7)}.${key.slice(0,4)}`:`Некорректная дата: ${value}`;}
export const formatLongDate=formatWorkoutDate;
export const isoToInputDate=dateKey;
export const inputDateToIso=(value:string):string|null=>resolveDate(value)?.toISOString()??null;
export const todayInputDate=()=>dateKey(new Date().toISOString());
export function yesterdayInputDate(){const date=new Date();date.setDate(date.getDate()-1);return dateKey(date.toISOString());}
export const defaultWorkoutName=(date=new Date())=>`Тренировка от ${formatWorkoutDate(date.toISOString())}`;
export function maskDate(value:string){const digits=value.replace(/\D/g,'').slice(0,8);return [digits.slice(0,2),digits.slice(2,4),digits.slice(4,8)].filter(Boolean).join('.');}
const SHORT=['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const DATIVE=['январю','февралю','марту','апрелю','маю','июню','июлю','августу','сентябрю','октябрю','ноябрю','декабрю'];
export const monthShortLabel=(key:string)=>SHORT[Number(key.slice(5))-1];
export const monthDativeLabel=(key:string,relativeTo:string)=>`${DATIVE[Number(key.slice(5))-1]}${key.slice(0,4)===relativeTo.slice(0,4)?'':` ${key.slice(0,4)}`}`;
