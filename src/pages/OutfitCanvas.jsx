/**
 * 搭配画布页面 (Outfit Canvas)
 *
 * 功能：
 * - 左侧：衣服选择网格（可拖拽）
 * - 右侧：画布区域（模特 + 可拖入的衣服）
 * - 拖拽移动、滚轮缩放、旋转
 */

import { useState, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { useClothes } from '../hooks/useClothes';
import { Upload, Save, Loader2, Trash2, RotateCcw } from 'lucide-react';

export default function OutfitCanvas() {
  const { clothes, loading } = useClothes();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [modelImage, setModelImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [canvasItems, setCanvasItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isRotating, setIsRotating] = useState(false);

  // 处理上传模特图片
  function handleModelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setModelImage(event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleResetModel() {
    setModelImage(null);
  }

  // 处理从网格拖拽到画布
  function handleDrop(e) {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('clothing');
      if (!dataStr) {
        console.log('No clothing data found');
        return;
      }
      const clothingData = JSON.parse(dataStr);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newItem = {
        id: Date.now(),
        clothingId: clothingData.id,
        image_url: clothingData.image_url,
        x,
        y,
        scale: 1,
        rotation: 0
      };

      setCanvasItems(prev => [...prev, newItem]);
      setSelectedId(newItem.id);
    } catch (err) {
      console.error('拖拽失败:', err);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  // 选中衣服
  function handleItemClick(e, id) {
    e.stopPropagation();
    setSelectedId(id);
  }

  // 点击空白处取消选中
  function handleCanvasClick() {
    setSelectedId(null);
  }

  // 删除选中的衣服
  function deleteSelected() {
    if (selectedId) {
      setCanvasItems(prev => prev.filter(item => item.id !== selectedId));
      setSelectedId(null);
    }
  }

  // 更新选中衣服的位置
  function updateItemPosition(id, x, y) {
    setCanvasItems(prev => prev.map(item =>
      item.id === id ? { ...item, x, y } : item
    ));
  }

  // 更新选中衣服的缩放
  function updateItemScale(id, delta) {
    setCanvasItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newScale = Math.max(0.2, Math.min(3, item.scale + delta));
      return { ...item, scale: newScale };
    }));
  }

  // 更新选中衣服的旋转
  function updateItemRotation(id, delta) {
    setCanvasItems(prev => prev.map(item =>
      item.id === id ? { ...item, rotation: item.rotation + delta } : item
    ));
  }

  // 滚轮缩放
  function handleWheel(e) {
    if (selectedId) {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      updateItemScale(selectedId, delta);
    }
  }

  // 拖拽移动衣服
  function handleMouseDown(e, id) {
    if (id !== selectedId) {
      setSelectedId(id);
    }

    const item = canvasItems.find(i => i.id === id);
    if (!item) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startItemX = item.x;
    const startItemY = item.y;

    function handleMouseMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      updateItemPosition(id, startItemX + dx, startItemY + dy);
    }

    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // 保存搭配
  async function handleSave() {
    setSaving(true);
    try {
      console.log('保存搭配:', { modelImage, items: canvasItems });
      alert('搭配已保存！（待实现数据库存储）');
    } catch (err) {
      console.error('保存失败:', err);
    } finally {
      setSaving(false);
    }
  }

  const selectedItem = canvasItems.find(item => item.id === selectedId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex h-[calc(100vh-64px)]">
        {/* 左侧：衣服选择网格 */}
        <div className="w-56 bg-white/50 backdrop-blur-sm border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-500 mb-3">我的衣服</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : clothes.length === 0 ? (
            <p className="text-xs text-gray-400">暂无衣服，请先添加衣服</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {clothes.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('clothing', JSON.stringify(item));
                  }}
                  className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden cursor-grab hover:shadow-lg transition-shadow"
                >
                  <img
                    src={item.image_url}
                    alt={item.code}
                    className="w-full h-full object-contain p-1"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：画布区域 */}
        <div className="flex-1 flex flex-col">
          {/* 工具栏 */}
          <div className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">模特</span>
              <button
                onClick={handleResetModel}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  !modelImage
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                默认
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  modelImage
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Upload size={12} className="inline mr-1" />
                上传模特
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleModelUpload}
                className="hidden"
              />
            </div>

            {/* 选中衣服的操作按钮 */}
            {selectedId && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateItemRotation(selectedId, -15)}
                  className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50"
                  title="逆时针旋转"
                >
                  <RotateCcw size={14} className="transform rotate-180" />
                </button>
                <button
                  onClick={() => updateItemRotation(selectedId, 15)}
                  className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50"
                  title="顺时针旋转"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={deleteSelected}
                  className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-full hover:bg-red-100"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-full hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
              保存搭配
            </button>
          </div>

          {/* 画布区域 */}
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-hidden m-4 rounded-2xl bg-white/30 backdrop-blur border-2 border-dashed border-gray-200"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
            style={{ minHeight: '500px' }}
          >
            {/* 模特层 */}
            {modelImage ? (
              <img
                src={modelImage}
                alt="模特"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[90%] object-contain pointer-events-none"
              />
            ) : (
              <img
                src="/model.png"
                alt="模特"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[90%] object-contain pointer-events-none"
              />
            )}

            {/* 衣服层 */}
            {canvasItems.map(item => (
              <div key={item.id}>
                {/* 旋转手柄 - 只在选中时显示 */}
                {selectedId === item.id && (
                  <div
                    className="absolute cursor-grab z-10"
                    style={{
                      left: item.x,
                      top: item.y - 60 * item.scale,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsRotating(true);
                      const startAngle = Math.atan2(
                        e.clientY - item.y,
                        e.clientX - item.x
                      ) * (180 / Math.PI) - item.rotation;

                      function handleRotateMove(e) {
                        const currentAngle = Math.atan2(
                          e.clientY - item.y,
                          e.clientX - item.x
                        ) * (180 / Math.PI);
                        const newRotation = currentAngle - startAngle;
                        setCanvasItems(prev => prev.map(i =>
                          i.id === item.id ? { ...i, rotation: newRotation } : i
                        ));
                      }

                      function handleRotateUp() {
                        setIsRotating(false);
                        document.removeEventListener('mousemove', handleRotateMove);
                        document.removeEventListener('mouseup', handleRotateUp);
                      }

                      document.addEventListener('mousemove', handleRotateMove);
                      document.addEventListener('mouseup', handleRotateUp);
                    }}
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                      <div className="w-0.5 h-3 bg-white rounded-full" />
                    </div>
                    <div className="w-0.5 h-6 bg-blue-500 mx-auto -mt-3" />
                  </div>
                )}

                {/* 衣服图片 */}
                <div
                  className={`absolute cursor-move ${selectedId === item.id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: item.x,
                    top: item.y,
                    transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`,
                    width: '120px'
                  }}
                  onMouseDown={(e) => {
                    if (!isRotating) handleMouseDown(e, item.id);
                  }}
                  onClick={(e) => handleItemClick(e, item.id)}
                  onDoubleClick={() => {
                    setCanvasItems(prev => prev.filter(i => i.id !== item.id));
                    if (selectedId === item.id) setSelectedId(null);
                  }}
                >
                  <img
                    src={item.image_url}
                    alt="衣服"
                    className="w-full h-auto pointer-events-none"
                    draggable={false}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 操作提示 */}
          <div className="text-center text-xs text-gray-400 pb-2">
            拖拽衣服到画布 · 点击选中后可拖动移动 · 鼠标滚轮缩放 · 双击删除 · 点击按钮旋转
          </div>
        </div>
      </div>
    </div>
  );
}
