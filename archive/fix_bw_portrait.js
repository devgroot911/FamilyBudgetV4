const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Update Theme to B&W / Grayscale
const oldTheme = `var reportTheme = {
  palette: {
    PRIMARY_DARK: "1F5C3A", ACCENT: "7BB661", LIGHT_BAND: "F4F8F4",
    BORDER_GREY: "D0D7D2", TEXT_DARK: "1A1A1A", TEXT_MUTED: "6B7280",
    WARN: "C0392B", WARN_FILL: "FADBD8", OK: "2E7D32", TINT: "E8F5E9"
  },
  fonts: {
    title: { name: "Calibri", sz: 14, bold: true, color: { rgb: "FFFFFF" } },
    section: { name: "Calibri", sz: 12, bold: true, color: { rgb: "1F5C3A" } },
    header: { name: "Calibri", sz: 10.5, bold: true, color: { rgb: "FFFFFF" } },`;

const newTheme = `var reportTheme = {
  palette: {
    PRIMARY_DARK: "E0E0E0", ACCENT: "808080", LIGHT_BAND: "F9F9F9",
    BORDER_GREY: "D0D0D0", TEXT_DARK: "1A1A1A", TEXT_MUTED: "6B6B6B",
    WARN: "1A1A1A", WARN_FILL: "EFEFEF", OK: "1A1A1A", TINT: "F0F0F0"
  },
  fonts: {
    title: { name: "Calibri", sz: 14, bold: true, color: { rgb: "1A1A1A" } },
    section: { name: "Calibri", sz: 12, bold: true, color: { rgb: "1A1A1A" } },
    header: { name: "Calibri", sz: 10.5, bold: true, color: { rgb: "1A1A1A" } },`;

appJs = appJs.replace(oldTheme, newTheme);

// 2. Fix Landscape to Portrait & adjust widths
const oldPageSetup1 = `ws1['!cols'] = [{wch:12}, {wch:30}, {wch:15}, {wch:18}, {wch:8}, {wch:12}, {wch:14}];
    ws1['!freeze'] = { ySplit: freezeRow };
    ws1['!pageSetup'] = { paperSize: 9, orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 };`;

const newPageSetup1 = `ws1['!cols'] = [{wch:11}, {wch:23}, {wch:12}, {wch:12}, {wch:5}, {wch:9}, {wch:10}];
    ws1['!freeze'] = { ySplit: freezeRow };
    ws1['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToWidth: 1, fitToHeight: 0 };`;

appJs = appJs.replace(oldPageSetup1, newPageSetup1);

// Also fix Sheet 2 title font in Grand Total block (remove PRIMARY_DARK specific override)
const oldGrandTotalFont = `color:{rgb:reportTheme.palette.PRIMARY_DARK}`;
const newGrandTotalFont = `color:{rgb:reportTheme.palette.TEXT_DARK}`;
appJs = appJs.replace(oldGrandTotalFont, newGrandTotalFont);

fs.writeFileSync('app.js', appJs);
console.log('Fixed B&W formatting and Portrait mode');
