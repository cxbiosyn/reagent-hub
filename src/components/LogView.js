const { useState, useMemo } = window.PreactHooks;

export function LogView({ logs, reagents, onLogsChange }) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState(''); // '' | '入库' | '出库'
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // 按 日期+试剂+动作 合并
  const groups = useMemo(() => {
    const map = {};
    [...logs].reverse().forEach(log => {
      const date = log.timestamp.slice(0, 10);
      const action = log.change_type === '+' ? '入库' : '出库';
      const key = `${date}_${log.reagent_code}_${action}`;
      if (!map[key]) {
        map[key] = { key, date, reagent_code: log.reagent_code, action, total: 0, logs: [] };
      }
      map[key].total += log.change_amount;
      map[key].logs.push(log);
    });
    return Object.values(map).sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.logs[0].timestamp.localeCompare(a.logs[0].timestamp);
    });
  }, [logs]);

  const toggleExpand = (key) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const r = reagents.find(rg => rg.code === g.reagent_code);
      const matchSearch = !search || g.reagent_code.toLowerCase().includes(search.toLowerCase()) || (r?.name || '').toLowerCase().includes(search.toLowerCase());
      const matchAction = !filterAction || g.action === filterAction;
      return matchSearch && matchAction;
    });
  }, [groups, search, filterAction, reagents]);

  const handleExport = () => {
    const data = filteredGroups.map(g => ({
      日期: g.date,
      试剂简写: g.reagent_code,
      试剂名称: reagents.find(r => r.code === g.reagent_code)?.name || '',
      动作: g.action,
      数量: g.total,
      明细笔数: g.logs.length,
    }));
    window.utils.exportToCSV(data, `试剂出入库记录_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleClearAll = () => {
    if (!confirm('确定清空所有操作记录？此操作不可恢复。')) return;
    onLogsChange([]);
  };

  const handleUndoLast = () => {
    if (logs.length === 0) return alert('暂无记录可撤销');
    if (!confirm(`确定撤销最近一条记录？\n${window.utils.formatDate(logs[logs.length-1].timestamp)} ${logs[logs.length-1].reagent_code} ${logs[logs.length-1].change_type}${logs[logs.length-1].change_amount}`)) return;
    onLogsChange(logs.slice(0, -1));
  };

  const handleDeleteLog = (timestamp) => {
    if (!confirm('确定删除该条记录？')) return;
    onLogsChange(logs.filter(l => l.timestamp !== timestamp));
  };

  const hasLogs = logs.length > 0;

  return window.html`
    <div class="fade-in">
      <div class="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input type="text" placeholder="搜索试剂简写或名称..." value=${search}
            onInput=${e => setSearch(e.target.value)}
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
        </div>
        <div class="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
          ${[['', '全部'], ['入库', '入库'], ['出库', '出库']].map(([val, label]) => window.html`
            <button key=${val} onClick=${() => setFilterAction(val)}
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterAction === val ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}">
              ${label}
            </button>
          `)}
        </div>
        <button onClick=${handleExport}
          class="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm">
          <span>⬇</span> 导出 CSV
        </button>
      </div>

      ${hasLogs && window.html`
        <div class="flex items-center gap-3 mb-4">
          <button onClick=${handleUndoLast}
            class="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-amber-400 hover:text-amber-600 transition-all text-sm font-medium text-gray-600"
            title="删除最近一条记录">
            <span>↩</span> 撤销最近一条
          </button>
          <button onClick=${handleClearAll}
            class="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-danger hover:text-danger transition-all text-sm font-medium text-gray-600"
            title="清空所有记录">
            <span>🗑</span> 清空全部
          </button>
          <span class="text-xs text-gray-400 ml-auto">共 ${logs.length} 条记录</span>
        </div>
      `}

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="text-left px-5 py-3.5 font-semibold text-gray-600 w-10"></th>
              <th class="text-left px-5 py-3.5 font-semibold text-gray-600">日期</th>
              <th class="text-left px-5 py-3.5 font-semibold text-gray-600">试剂</th>
              <th class="text-center px-5 py-3.5 font-semibold text-gray-600 w-24">动作</th>
              <th class="text-center px-5 py-3.5 font-semibold text-gray-600 w-24">数量</th>
              <th class="text-left px-5 py-3.5 font-semibold text-gray-600">操作人</th>
              <th class="text-left px-5 py-3.5 font-semibold text-gray-600">备注摘要</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${filteredGroups.map(g => window.html`
              <tr key=${g.key} class="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick=${() => toggleExpand(g.key)}>
                <td class="px-5 py-3.5 text-center text-gray-400 text-xs select-none">${expandedGroups.has(g.key) ? '▼' : '▶'}</td>
                <td class="px-5 py-3.5 text-gray-700 font-medium">${g.date}</td>
                <td class="px-5 py-3.5">
                  <span class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded mr-2">${g.reagent_code}</span>
                  <span class="text-gray-700">${reagents.find(r => r.code === g.reagent_code)?.name}</span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <span class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${g.action === '入库' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}">${g.action}</span>
                </td>
                <td class="px-5 py-3.5 text-center font-bold text-lg ${g.action === '入库' ? 'text-green-600' : 'text-red-500'}">${g.total}</td>
                <td class="px-5 py-3.5 text-gray-600 text-xs">${g.logs[0]?.operator || '未知'}</td>
                <td class="px-5 py-3.5 text-gray-400 text-xs">${g.logs.length > 1 ? `共 ${g.logs.length} 笔明细` : (g.logs[0]?.note || '')}</td>
              </tr>
              ${expandedGroups.has(g.key) && window.html`
                <tr class="bg-gray-50/60">
                  <td class="px-5 py-2"></td>
                  <td colspan="6" class="px-5 py-2">
                    <div class="text-xs space-y-1">
                      ${g.logs.map((log, i) => window.html`
                        <div key=${i} class="flex items-center gap-4 text-gray-500 py-0.5 border-b border-gray-100 last:border-0">
                          <span class="w-32 text-gray-400">${window.utils.formatDate(log.timestamp)}</span>
                          <span class="w-20">${log.location}</span>
                          <span class="w-16 font-mono">${log.change_type}${log.change_amount}</span>
                          <span class="w-16 text-gray-600">${log.operator || '未知'}</span>
                          <span class="flex-1">${log.note}</span>
                          <button onClick=${(e) => { e.stopPropagation(); handleDeleteLog(log.timestamp); }}
                            class="text-gray-300 hover:text-danger transition-colors" title="删除">✕</button>
                        </div>
                      `)}
                    </div>
                  </td>
                </tr>
              `}
            `)}
          </tbody>
        </table>
        ${filteredGroups.length === 0 && window.html`
          <div class="text-center py-16 text-gray-400">
            <div class="text-5xl mb-3 opacity-50">📋</div>
            <p>暂无操作记录</p>
          </div>
        `}
      </div>
    </div>
  `;
}

// ==================== 试剂管理（含字段配置 + 动态表单） ====================

