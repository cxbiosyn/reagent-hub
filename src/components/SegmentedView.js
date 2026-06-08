/**
 * [v1.0.0] 分仓明细视图
 * 改动记录：
 * - 新增：移库双向（903↔908），移库自动记日志
 * - 新增：快速出库模式（toggle 切换，免确认）
 * - 新增：低库存预警标红（名称红色+背景淡红）
 * - 新增：货架位置点击直接编辑
 * - 优化：表格列精简（品牌独立列，去掉采购单号等）
 * - 修复：搜索覆盖所有可见字段（含品牌、货架位置）
 */
const { useState, useMemo } = window.PreactHooks;

export function SegmentedView({ reagents, inventory, fields, onInventoryChange }) {
  const [activeTab, setActiveTab] = useState('903');
  const [search, setSearch] = useState('');
  const [pendingQty, setPendingQty] = useState({});
  const [transferQty, setTransferQty] = useState({});
  const [editingPos, setEditingPos] = useState(null); // { id, value }
  const [quickMode, setQuickMode] = useState(() => localStorage.getItem('ri_quick_mode') === 'true');
  const customFields = fields.filter(f => !f.builtin);
  // 分仓明细只展示关键的自定义字段
  const showInSegmented = ['负责人', '储存条件'];
  const visibleFields = customFields.filter(f => showInSegmented.includes(f.label));

  const toggleQuickMode = () => {
    const next = !quickMode;
    setQuickMode(next);
    localStorage.setItem('ri_quick_mode', String(next));
  };

  const filteredInventory = useMemo(() => {
    return inventory
      .filter(inv => inv.location === activeTab)
      .filter(inv => {
        const r = reagents.find(rg => rg.id === inv.reagent_id);
        if (!r) return false;
        const s = search.toLowerCase().trim();
        if (!s) return true;
        // 搜索覆盖该页面所有可见字段
        const nameMatch = r.name.toLowerCase().includes(s);
        const codeMatch = r.code.toLowerCase().includes(s);
        const brandMatch = (r.brand || '').toLowerCase().includes(s);
        const posMatch = (inv.shelf_position || '').toLowerCase().includes(s);
        const customMatch = Object.values(r.custom || {}).some(v => String(v).toLowerCase().includes(s));
        return nameMatch || codeMatch || brandMatch || posMatch || customMatch;
      })
      .map(inv => ({ ...inv, reagent: reagents.find(rg => rg.id === inv.reagent_id) }))
      .sort((a, b) => (a.reagent?.code || '').localeCompare(b.reagent?.code || ''));
  }, [inventory, activeTab, reagents, search]);

  const handleQuantityChange = (itemId, newQuantity) => {
    const item = inventory.find(inv => inv.id === itemId);
    if (!item) return;
    const diff = newQuantity - item.current_quantity;
    if (diff === 0) return;
    onInventoryChange(itemId, newQuantity);
  };

  const confirmQtyChange = (itemId) => {
    const val = pendingQty[itemId];
    if (val === undefined) return;
    handleQuantityChange(itemId, val);
    setPendingQty(prev => { const next = { ...prev }; delete next[itemId]; return next; });
  };

  const cancelQtyChange = (itemId) => {
    setPendingQty(prev => { const next = { ...prev }; delete next[itemId]; return next; });
  };

  const handlePositionChange = (itemId, newPos) => {
    const item = inventory.find(inv => inv.id === itemId);
    if (!item || newPos.trim() === item.shelf_position) return;
    onInventoryChange(itemId, item.current_quantity, { shelf_position: newPos.trim() || '待分配' }, { skipLog: true });
    setEditingPos(null);
  };

  const handleTransfer = (itemId, direction) => {
    const item = inventory.find(inv => inv.id === itemId);
    if (!item || item.current_quantity <= 0) return alert('库存不足，无法移库');
    const qty = parseInt(transferQty[itemId] || '1', 10);
    if (isNaN(qty) || qty <= 0) return alert('请输入有效的移库数量');
    if (qty > item.current_quantity) return alert('移库数量不能超过当前库存');

    const fromLocation = item.location;
    const toLocation = direction === 'to903' ? '903' : '908';
    const transferNote = `${fromLocation}→${toLocation} 移库`;

    // 扣减来源仓库
    onInventoryChange(itemId, item.current_quantity - qty, null, { note: transferNote, changeType: '→' });

    // 增加目标仓库
    const targetItem = inventory.find(inv => inv.reagent_id === item.reagent_id && inv.location === toLocation);
    if (targetItem) {
      onInventoryChange(targetItem.id, targetItem.current_quantity + qty, null, { note: transferNote, changeType: '→' });
    } else {
      const newId = Math.max(...inventory.map(i => i.id), 0) + 1;
      onInventoryChange('__NEW__', {
        id: newId, reagent_id: item.reagent_id, location: toLocation,
        shelf_position: '待分配', purchase_order: item.purchase_order, current_quantity: qty
      });
    }
    setTransferQty(prev => { const next = { ...prev }; delete next[itemId]; return next; });
  };

  const handleQuickChange = (itemId, newQuantity) => {
    if (newQuantity < 0) return alert('数量不能为负数');
    handleQuantityChange(itemId, newQuantity);
  };

  const isLowStock = (item) => {
    const reagent = item.reagent;
    if (!reagent || !reagent.safety_stock) return false;
    return item.current_quantity < reagent.safety_stock;
  };

  return window.html`
    <div class="fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div class="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
          ${['903', '908'].map(tab => window.html`
            <button key=${tab} onClick=${() => { setActiveTab(tab); setSearch(''); }}
              class="px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}">
              ${tab}
            </button>
          `)}
        </div>
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input type="text" placeholder="搜索试剂、采购单号或自定义字段..." value=${search}
            onInput=${e => setSearch(e.target.value)}
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
        </div>
        <button onClick=${toggleQuickMode}
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${quickMode ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}">
          <span>${quickMode ? '🚀' : '🐢'}</span>
          <span>${quickMode ? '快速模式' : '标准模式'}</span>
        </button>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left px-5 py-3.5 font-semibold text-gray-600">试剂名称</th>
                <th class="text-left px-5 py-3.5 font-semibold text-gray-600 w-20">简写</th>
                <th class="text-left px-5 py-3.5 font-semibold text-gray-600">品牌</th>
                ${visibleFields.map(cf => window.html`<th key=${cf.id} class="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs">${cf.label}</th>`)}
                <th class="text-left px-5 py-3.5 font-semibold text-gray-600">货架位置</th>
                <th class="text-center px-5 py-3.5 font-semibold text-gray-600 w-44">数量操作</th>
                <th class="text-center px-5 py-3.5 font-semibold text-gray-600 w-32">移库</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${filteredInventory.map(item => window.html`
                <tr key=${item.id} class="hover:bg-gray-50/50 transition-colors ${isLowStock(item) ? 'bg-red-50/40' : ''}">
                  <td class="px-5 py-4">
                    <div class="font-medium ${isLowStock(item) ? 'text-red-700 font-bold' : 'text-gray-800'}">${item.reagent?.name}</div>
                    ${isLowStock(item) && window.html`<div class="text-[10px] text-red-500 mt-0.5 font-bold">⚠ 低于安全库存 (${item.reagent?.safety_stock})</div>`}
                  </td>
                  <td class="px-5 py-4">
                    <span class="inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-bold rounded">${item.reagent?.code}</span>
                  </td>
                  <td class="px-5 py-4 text-gray-600 text-xs">${item.reagent?.brand || '—'}</td>
                  ${visibleFields.map(cf => window.html`
                    <td key=${cf.id} class="px-5 py-4 text-gray-500 text-xs">${item.reagent?.custom?.[cf.id] || '—'}</td>
                  `)}
                  <td class="px-5 py-4 text-gray-600">
                    ${editingPos?.id === item.id
                      ? window.html`<input type="text" value=${editingPos.value}
                          onInput=${e => setEditingPos({ ...editingPos, value: e.target.value })}
                          onKeyDown=${e => { if (e.key === 'Enter') handlePositionChange(item.id, editingPos.value); if (e.key === 'Escape') setEditingPos(null); }}
                          onBlur=${() => handlePositionChange(item.id, editingPos.value)}
                          class="w-24 px-2 py-1 text-xs border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus />`
                      : window.html`<span class="cursor-pointer hover:text-primary hover:underline" onClick=${() => setEditingPos({ id: item.id, value: item.shelf_position })}>${item.shelf_position}</span>`
                    }
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex justify-center items-center gap-2">
                      ${quickMode
                        ? window.html`
                          <${window.QuantityStepper} quantity=${item.current_quantity}
                            onChange=${val => handleQuickChange(item.id, val)} />
                        `
                        : window.html`
                          <${window.QuantityStepper} quantity=${pendingQty[item.id] !== undefined ? pendingQty[item.id] : item.current_quantity}
                            onChange=${val => setPendingQty({ ...pendingQty, [item.id]: val })} />
                          ${pendingQty[item.id] !== undefined && pendingQty[item.id] !== item.current_quantity && window.html`
                            <div class="flex items-center gap-1 ml-1">
                              <button onClick=${() => confirmQtyChange(item.id)} class="w-6 h-6 rounded bg-green-500 hover:bg-green-600 text-white text-xs flex items-center justify-center shadow-sm" title="确认">✓</button>
                              <button onClick=${() => cancelQtyChange(item.id)} class="w-6 h-6 rounded bg-gray-300 hover:bg-gray-400 text-white text-xs flex items-center justify-center shadow-sm" title="取消">✕</button>
                            </div>
                          `}
                        `
                      }
                    </div>
                  </td>
                  <td class="px-5 py-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                      <input type="number" min="1" max=${item.current_quantity}
                        value=${transferQty[item.id] || ''}
                        onInput=${e => setTransferQty({ ...transferQty, [item.id]: e.target.value })}
                        placeholder="数量"
                        class="w-14 h-7 px-1.5 text-center text-xs rounded border border-gray-200 focus:outline-none focus:border-primary font-mono"
                        disabled=${item.current_quantity <= 0} />
                      ${activeTab === '908'
                        ? window.html`
                          <button onClick=${() => handleTransfer(item.id, 'to903')}
                            disabled=${item.current_quantity <= 0}
                            class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-white ${item.current_quantity <= 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-blue-800 shadow-sm'}"
                            title="从908移库到903">
                            <span>→</span> 移入903
                          </button>
                        `
                        : window.html`
                          <button onClick=${() => handleTransfer(item.id, 'to908')}
                            disabled=${item.current_quantity <= 0}
                            class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-white ${item.current_quantity <= 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 shadow-sm'}"
                            title="从903移库到908">
                            <span>→</span> 移入908
                          </button>
                        `
                      }
                    </div>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${filteredInventory.length === 0 && window.html`
          <div class="text-center py-16 text-gray-400">
            <div class="text-5xl mb-3 opacity-50">📦</div>
            <p>该库房暂无匹配的库存记录</p>
          </div>
        `}
      </div>
    </div>
  `;
}
