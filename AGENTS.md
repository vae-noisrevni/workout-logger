This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md


## Совместимость данных, импорт и экспорт

- При каждом обновлении модели данных обязательно проверять модули импорта и экспорта: `src/utils/importHistory.ts`, `src/utils/exportHistory.ts`, `src/utils/exerciseTransfer.ts`, связанные типы, репозитории, миграции и восстановление черновика.
- Каждое новое сохраняемое поле должно проходить полный путь: импорт → БД → чтение → редактирование/черновик → сохранение → экспорт. Нельзя молча терять поле при редактировании или повторном экспорте.
- Проверять JSON и CSV; обновлять схемы, документацию и примеры в `docs/formats/`. Для старых файлов без новых полей задавать совместимые значения по умолчанию. По возможности расширять формат опциональными полями, не требуя ручной правки пользовательских JSON.
- Обязательно проверять перенос туда и обратно на временной SQLite-базе: сравнивать даты, порядок упражнений и подходов, повторы, точность весов, комментарии и остальные сохраняемые поля. Для запускаемого теста проверять чувствительность к временной поломке проверяемой логики.
- Если пользователь предоставил реальные экспорты, дополнительно прогонять именно их через действующие парсеры и репозитории. Исходные файлы и рабочую БД не изменять, личные данные не добавлять в тестовые фикстуры репозитория.
- Проверять и явно описывать дубли и повторный импорт: история пропускает существующие дату/название, справочник создаёт новые записи. Не объединять и не удалять пользовательские данные без согласованного решения.
- Исключения из экспорта должны быть явно согласованы и задокументированы. Сейчас по решению пользователя не экспортируются пресеты, их связи с историей и замеры веса тела; это не разрешает игнорировать остальные новые поля.
