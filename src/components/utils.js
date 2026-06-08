export function getShelfLabel(shelf, row, col) {
  const prefix = shelf.prefix;
  let position = '';
  if (shelf.rows === 1) position = '';
  else if (shelf.rows === 2) position = row === 0 ? '上' : '下';
  else if (shelf.rows === 3) position = row === 0 ? '上' : row === 1 ? '中' : '下';
  else position = String(row + 1);
  // cols === 1 时简化编码，不显示列号
  if (shelf.cols === 1) {
    return position ? `${prefix}-${position}` : prefix;
  }
  const colNum = String(col + 1).padStart(2, '0');
  return position ? `${prefix}-${colNum}-${position}` : `${prefix}-${colNum}`;
}

export function getDefaultInnerLayout(wb) {
  // 如果已有 innerLayout 且结构与当前架子和抽屉数量匹配，直接返回
  if (wb.innerLayout) {
    const shelfMatch = wb.innerLayout.shelves?.length === wb.shelf.rows &&
      wb.innerLayout.shelves?.every((s, i) => s.row === i);
    const drawerMatch = wb.innerLayout.drawers?.length === wb.drawers.length &&
      wb.innerLayout.drawers?.every((d, i) => d.id === wb.drawers[i]?.id);
    if (shelfMatch && drawerMatch) return wb.innerLayout;
  }
  const cat = wb.category || 'workbench';
  const hasDrawers = wb.drawers.length > 0 && cat !== 'fridge' && cat !== 'shelf-unit';
  const shelves = [];
  const rows = wb.shelf.rows;
  const shelfGap = 2;
  const shelfAvailable = hasDrawers ? 46 : 96;
  const shelfHeight = rows > 0 ? Math.max(8, (shelfAvailable - shelfGap * (rows - 1)) / rows) : 0;
  for (let i = 0; i < rows; i++) {
    shelves.push({
      row: i,
      x: 2,
      y: 2 + i * (shelfHeight + shelfGap),
      w: 96,
      h: shelfHeight
    });
  }
  const drawers = [];
  const drawerCount = wb.drawers.length;
  const drawerGap = 2;
  const drawerHeight = hasDrawers ? 46 : 0;
  const drawerWidth = hasDrawers ? Math.max(10, (96 - drawerGap * (drawerCount - 1)) / drawerCount) : 0;
  for (let i = 0; i < drawerCount; i++) {
    drawers.push({
      id: wb.drawers[i].id,
      x: 2 + i * (drawerWidth + drawerGap),
      y: 52,
      w: drawerWidth,
      h: drawerHeight
    });
  }
  return { shelves, drawers };
}

export function findCellByPosition(layout, position) {
  if (!layout || !position) return null;
  if (layout.type === 'lab') {
    for (const wb of layout.workbenches) {
      for (let r = 0; r < wb.shelf.rows; r++) {
        for (let c = 0; c < wb.shelf.cols; c++) {
          if (getShelfLabel(wb.shelf, r, c) === position) return { type: 'shelf', workbench: wb, row: r, col: c, label: position };
        }
        // 兼容旧格式（cols=1 时的旧编码 A-01-上）
        if (wb.shelf.cols === 1) {
          const prefix = wb.shelf.prefix;
          let pos = '';
          if (wb.shelf.rows === 1) pos = '';
          else if (wb.shelf.rows === 2) pos = r === 0 ? '上' : '下';
          else if (wb.shelf.rows === 3) pos = r === 0 ? '上' : r === 1 ? '中' : '下';
          else pos = String(r + 1);
          const oldLabel = pos ? `${prefix}-01-${pos}` : `${prefix}-01`;
          if (oldLabel === position) return { type: 'shelf', workbench: wb, row: r, col: 0, label: position };
        }
      }
      for (const drawer of wb.drawers) {
        if (drawer.prefix === position) return { type: 'drawer', workbench: wb, drawer, label: position };
      }
    }
  } else if (layout.type === 'warehouse') {
    for (const zone of layout.zones) {
      for (const rack of zone.racks) {
        for (let r = 0; r < rack.rows; r++) {
          for (let c = 0; c < rack.cols; c++) {
            if (getShelfLabel(rack, r, c) === position) return { type: 'rack', zone, rack, row: r, col: c, label: position };
          }
          if (rack.cols === 1) {
            const prefix = rack.prefix;
            let pos = '';
            if (rack.rows === 1) pos = '';
            else if (rack.rows === 2) pos = r === 0 ? '上' : '下';
            else if (rack.rows === 3) pos = r === 0 ? '上' : r === 1 ? '中' : '下';
            else pos = String(r + 1);
            const oldLabel = pos ? `${prefix}-01-${pos}` : `${prefix}-01`;
            if (oldLabel === position) return { type: 'rack', zone, rack, row: r, col: 0, label: position };
          }
        }
      }
      for (const cabinet of zone.cabinets) {
        if (cabinet.prefix === position) return { type: 'cabinet', zone, cabinet, label: position };
      }
    }
  }
  return null;
}

// ==================== 工具函数 ====================
export function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function exportToCSV(data, filename) {
  if (data.length === 0) return alert('无数据可导出');
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const val = row[h];
    if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
      return '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
  }).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || '');
    return obj;
  });
}
