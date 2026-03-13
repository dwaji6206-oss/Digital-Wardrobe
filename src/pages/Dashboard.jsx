import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { useClothes } from '../hooks/useClothes';
import { useClothingNames } from '../hooks/useClothingNames';
import { useClothingColors } from '../hooks/useClothingColors';
import AddClothingModal from '../components/wardrobe/AddClothingModal';
import ClothingDetailModal from '../components/wardrobe/ClothingDetailModal';
import { Plus, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { clothes, loading, error, deleteClothing, fetchClothes } = useClothes();
  const { names, loading: namesLoading, error: namesError } = useClothingNames();
  const { colors, loading: colorsLoading, error: colorsError } = useClothingColors();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [filterColor, setFilterColor] = useState('');

  // 拖拽排序状态
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null); // 目标插入位置索引
  const [localOrder, setLocalOrder] = useState([]); // 本地排序顺序
  const longPressTimer = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPressActive, setIsLongPressActive] = useState(false); // 长按已激活
  const containerRef = useRef(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 }); // 拖拽位置
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 }); // 起始位置
  const [longPressItemId, setLongPressItemId] = useState(null); // 正在长按的元素

  // 过滤后的衣服列表
  const filteredClothes = useMemo(() => {
    let filtered = clothes.filter(item => {
      const matchName = !filterName || item.clothing_names?.name === filterName;
      const matchColor = !filterColor || item.clothing_colors?.name === filterColor;
      return matchName && matchColor;
    });

    // 如果有本地排序，按本地排序重新排列
    if (localOrder.length > 0) {
      const orderMap = new Map(localOrder.map((id, index) => [id, index]));
      filtered = [...filtered].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? Infinity;
        const orderB = orderMap.get(b.id) ?? Infinity;
        return orderA - orderB;
      });
    }

    return filtered;
  }, [clothes, filterName, filterColor, localOrder]);

  // 初始化本地排序
  useEffect(() => {
    if (clothes.length > 0 && localOrder.length === 0) {
      setLocalOrder(clothes.map(item => item.id));
    }
  }, [clothes, localOrder.length]);

  // 长按开始
  const handleLongPressStart = useCallback((item, e) => {
    e.preventDefault();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    setStartPosition({ x: clientX, y: clientY });
    setDragPosition({ x: clientX, y: clientY });
    setLongPressItemId(item.id);

    longPressTimer.current = setTimeout(() => {
      setIsLongPressActive(true);
      setIsDragging(true);
      setDraggedItem(item);
      // 触发震动反馈（如果设备支持）
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 400); // 400ms 长按
  }, []);

  // 取消长按计时器（不结束拖拽）
  const cancelLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressItemId(null);
  }, []);

  // 获取指定位置下的元素索引
  const getIndexAtPosition = useCallback((x, y) => {
    const container = containerRef.current;
    if (!container) return null;

    const items = container.querySelectorAll('[data-clothing-id]');
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return i;
      }
    }
    return null;
  }, []);

  // 拖拽移动
  const handleDragMove = useCallback((e) => {
    if (!isDragging || !draggedItem) return;

    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

    if (clientX === undefined || clientY === undefined) return;

    // 更新拖拽位置
    setDragPosition({ x: clientX, y: clientY });

    // 获取目标位置索引
    const targetIndex = getIndexAtPosition(clientX, clientY);
    if (targetIndex !== null) {
      setDragOverIndex(targetIndex);
    }
  }, [isDragging, draggedItem, getIndexAtPosition]);

  // 拖拽结束 - 完成排序
  const handleDragEnd = useCallback(() => {
    // 先取消长按计时器
    cancelLongPressTimer();

    // 执行排序
    if (draggedItem && dragOverIndex !== null) {
      const draggedIndex = filteredClothes.findIndex(c => c.id === draggedItem.id);
      if (draggedIndex !== -1 && draggedIndex !== dragOverIndex) {
        const newOrder = [...localOrder];
        const draggedId = draggedItem.id;

        // 找到在 localOrder 中的位置
        const orderDraggedIndex = newOrder.indexOf(draggedId);
        const targetId = filteredClothes[dragOverIndex]?.id;
        const orderTargetIndex = newOrder.indexOf(targetId);

        if (orderDraggedIndex !== -1 && orderTargetIndex !== -1) {
          newOrder.splice(orderDraggedIndex, 1);
          // 如果向后拖，需要调整目标索引
          const adjustedIndex = orderDraggedIndex < orderTargetIndex ? orderTargetIndex - 1 : orderTargetIndex;
          newOrder.splice(adjustedIndex, 0, draggedId);
          setLocalOrder(newOrder);
        }
      }
    }

    // 重置状态
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setIsLongPressActive(false);
    setLongPressItemId(null);
  }, [draggedItem, dragOverIndex, filteredClothes, localOrder, cancelLongPressTimer]);

  async function handleDelete(id) {
    try {
      await deleteClothing(id);
      setSelectedClothing(null);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 select-none" style={{ cursor: isDragging ? 'grabbing' : 'default' }}>
      {/* 长按震动动画样式 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-2px) rotate(-1deg); }
          50% { transform: translateX(2px) rotate(1deg); }
          75% { transform: translateX(-1px) rotate(-0.5deg); }
        }
        .long-press-active {
          animation: shake 0.3s ease-in-out;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
      `}</style>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 标题和添加按钮 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-light tracking-wider text-gray-900">我的衣服</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus size={18} className="mr-2" />
            添加衣服
          </button>
        </div>

        {/* 筛选栏 */}
        {clothes.length > 0 && (
          <div className="glass rounded-2xl p-4 mb-6">
            {/* 加载状态或错误 */}
            {(namesLoading || colorsLoading) && (
              <div className="text-sm text-gray-400 mb-3">加载中...</div>
            )}
            {(namesError || colorsError) && (
              <div className="text-sm text-red-500 mb-3">加载失败: {namesError || colorsError}</div>
            )}
            {/* 调试信息 */}
            {names.length === 0 && !namesLoading && (
              <div className="text-xs text-gray-400 mb-3">names: {JSON.stringify(names)}, colors: {JSON.stringify(colors)}</div>
            )}

            {/* 服装名称筛选 - 独占一行 */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-gray-500 font-medium shrink-0">服装名称</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterName('')}
                  className={`pill ${!filterName ? 'pill-active' : 'pill-inactive'}`}
                >
                  全部
                </button>
                {!namesLoading && names.map(name => (
                  <button
                    key={name.id}
                    onClick={() => setFilterName(name.name)}
                    className={`pill ${filterName === name.name ? 'pill-active' : 'pill-inactive'}`}
                  >
                    {name.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 颜色筛选 - 独占一行 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium shrink-0">颜色</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterColor('')}
                  className={`pill ${!filterColor ? 'pill-active' : 'pill-inactive'}`}
                >
                  全部
                </button>
                {!colorsLoading && colors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setFilterColor(color.name)}
                    className={`pill ${filterColor === color.name ? 'pill-active' : 'pill-inactive'}`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : filteredClothes.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="mb-4">{clothes.length === 0 ? '您的衣橱还是空的' : '没有符合条件的衣服'}</p>
            {clothes.length === 0 && (
              <button onClick={() => setShowAddModal(true)} className="text-gray-900 underline">
                添加第一件衣服
              </button>
            )}
          </div>
        ) : (
          /* 极简网格 - 只显示图片 */
          <div
            ref={containerRef}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 select-none"
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
            onMouseMove={isDragging ? handleDragMove : undefined}
            onMouseUp={isDragging ? handleDragEnd : undefined}
            onMouseLeave={isDragging ? handleDragEnd : undefined}
            onTouchMove={isDragging ? handleDragMove : undefined}
            onTouchEnd={isDragging ? handleDragEnd : undefined}
          >
            {filteredClothes.map((item, index) => {
              const isBeingDragged = draggedItem?.id === item.id;
              const isDropTarget = dragOverIndex === index;
              const isLongPressingThis = longPressItemId === item.id && isLongPressActive;

              return (
                <div
                  key={item.id}
                  data-clothing-id={item.id}
                  onMouseDown={(e) => !isDragging && handleLongPressStart(item, e)}
                  onMouseUp={cancelLongPressTimer}
                  onTouchStart={(e) => !isDragging && handleLongPressStart(item, e)}
                  onTouchEnd={cancelLongPressTimer}
                  onClick={() => {
                    if (!isDragging && !isLongPressActive) {
                      setSelectedClothing(item);
                    }
                    // 重置长按状态，允许下次点击
                    if (isLongPressActive) {
                      setIsLongPressActive(false);
                    }
                  }}
                  className={`group relative bg-gray-100/50 overflow-hidden transition-all duration-200 rounded-2xl p-2 ${
                    isBeingDragged
                      ? 'opacity-30 scale-95'
                      : isDropTarget
                      ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.02]'
                      : isLongPressingThis
                      ? 'long-press-active'
                      : isDragging
                      ? ''
                      : 'hover:shadow-xl cursor-pointer'
                  }`}
                  style={{ touchAction: isDragging ? 'none' : 'auto' }}
                >
                  <div className="aspect-[3/4] bg-white/30 rounded-xl">
                    <img
                      src={item.image_url}
                      alt={item.code}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      draggable={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 拖拽中的悬浮预览 */}
      {isDragging && draggedItem && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragPosition.x - 60,
            top: dragPosition.y - 80,
            width: 120,
          }}
        >
          <div className="bg-white rounded-2xl p-2 shadow-2xl ring-2 ring-blue-500 scale-110">
            <div className="aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden">
              <img
                src={draggedItem.image_url}
                alt={draggedItem.code}
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          </div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/90 px-2 py-1 rounded-full whitespace-nowrap">
            拖动到目标位置
          </div>
        </div>
      )}

      {/* 添加衣服弹窗 */}
      {showAddModal && (
        <AddClothingModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchClothes();
          }}
        />
      )}

      {/* 衣服详情弹窗 */}
      {selectedClothing && (
        <ClothingDetailModal
          clothing={selectedClothing}
          onClose={() => setSelectedClothing(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
