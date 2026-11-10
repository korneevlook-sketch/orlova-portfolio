# Портфолио Вероники Орловой

Сайт: https://korneevlook-sketch.github.io/orlova-portfolio/

Статический сайт (HTML, CSS, JS без сборки), публикуется через GitHub Pages из ветки `main`.
Инструкция для ИИ-агентов и все правила проекта: [AGENTS.md](AGENTS.md).

## Быстрые правки без агента

- **Текст:** открыть `index.html` на GitHub, нажать карандаш «Edit», найти фразу поиском (Ctrl+F), поправить только текст между тегами, нажать «Commit changes». Сайт обновится через 1–2 минуты.
- **Фото:** загрузить в `assets/img/media/` через «Add file → Upload files» под новым именем (`.webp`, `.jpg` и `-sm.webp`), затем поменять имя файла в `index.html`.
- **После правок `css/style.css` или `js/main.js`:** в `index.html` поменять число после `style.css?v=` и `main.js?v=`, иначе телефоны покажут старую версию.

## Проверить локально

```
python3 -m http.server 8000
```
и открыть http://localhost:8000.
