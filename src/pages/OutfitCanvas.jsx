/**
 * 搭配画布页面 (Outfit Canvas)
 *
 * 功能：
 * - 左侧：衣服选择网格（可拖拽）
 * - 右侧：画布区域（模特 + 可拖入的衣服）
 * - 拖拽移动、滚轮缩放、旋转
 * - 保存搭配到数据库
 */

import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import SaveOutfitModal from '../components/outfit/SaveOutfitModal';
import { useClothes } from '../hooks/useClothes';
import { useOutfits } from '../hooks/useOutfits';
import { useClothingNames } from '../hooks/useClothingNames';
import { useClothingColors } from '../hooks/useClothingColors';
import { Upload, Save, Loader2, CheckCircle } from 'lucide-react';

export default function OutfitCanvas() {
  const navigate = useNavigate();
  const { clothes, loading } = useClothes();
  const { addOutfit, uploadOutfitImage } = useOutfits();
  const { names } = useClothingNames();
  const { colors } = useClothingColors();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [modelImage, setModelImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [canvasItems, setCanvasItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 筛选状态
  const [filterName, setFilterName] = useState('');
  const [filterColor, setFilterColor] = useState('');

  // 筛选后的衣服列表（排除已在画布上的衣服）
  const filteredClothes = useMemo(() => {
    // 获取已在画布上的衣服ID集合
    const canvasClothesIds = new Set(canvasItems.map(item => item.clothingId));

    return clothes.filter(item => {
      // 排除已在画布上的衣服
      if (canvasClothesIds.has(item.id)) return false;

      const matchName = !filterName || item.clothing_names?.name === filterName;
      const matchColor = !filterColor || item.clothing_colors?.name === filterColor;
      return matchName && matchColor;
    });
  }, [clothes, filterName, filterColor, canvasItems]);

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
        clothingId: clothingData.id, // 保留衣服的数据库ID
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

  // 生成画布截图
  async function generateCanvasImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const containerRect = canvasRef.current.getBoundingClientRect();

    // 设置画布尺寸
    canvas.width = containerRect.width * 2; // 2x for retina
    canvas.height = containerRect.height * 2;
    ctx.scale(2, 2);

    // 绘制背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, containerRect.width, containerRect.height);

    // 绘制模特图片
    const modelSrc = modelImage || '/model.png';
    await new Promise((resolve) => {
      const modelImg = new Image();
      modelImg.crossOrigin = 'anonymous';
      modelImg.onload = () => {
        const scale = Math.min(
          containerRect.width * 0.9 / modelImg.width,
          containerRect.height * 0.9 / modelImg.height
        );
        const w = modelImg.width * scale;
        const h = modelImg.height * scale;
        const x = (containerRect.width - w) / 2;
        const y = (containerRect.height - h) / 2;
        ctx.drawImage(modelImg, x, y, w, h);
        resolve();
      };
      modelImg.onerror = resolve;
      modelImg.src = modelSrc;
    });

    // 绘制所有衣服
    for (const item of canvasItems) {
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate(item.rotation * Math.PI / 180);
          ctx.scale(item.scale, item.scale);
          const w = 120;
          const h = (img.height / img.width) * w;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
          resolve();
        };
        img.onerror = resolve;
        img.src = item.image_url;
      });
    }

    return canvas.toDataURL('image/png');
  }

  // 处理保存搭配
  async function handleSave(formData) {
    setSaving(true);
    try {
      // 生成画布截图
      const imageDataUrl = await generateCanvasImage();

      // 上传图片到存储桶
      const imageUrl = await uploadOutfitImage(imageDataUrl, formData.title);

      // 保存到数据库
      await addOutfit({
        ...formData,
        image_url: imageUrl
      });

      // 显示成功状态
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSaveModal(false);
        setCanvasItems([]);
        setSelectedId(null);
      }, 1500);
    } catch (err) {
      console.error('保存失败:', err);
      throw err;
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
        <div className="w-56 bg-white/50 backdrop-blur-sm border-r border-gray-200 p-4 overflow-y-auto select-none" style={{ cursor: 'default' }}>
          <h3 className="text-sm font-medium text-gray-500 mb-3">我的衣服</h3>

          {/* 筛选下拉框 */}
          <div className="space-y-2 mb-4">
            {/* 名称筛选 */}
            <select
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-white/60 border border-gray-200/50 rounded-lg focus:outline-none focus:border-gray-400"
            >
              <option value="">全部名称</option>
              {names.map(name => (
                <option key={name.id} value={name.name}>{name.name}</option>
              ))}
            </select>

            {/* 颜色筛选 */}
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-white/60 border border-gray-200/50 rounded-lg focus:outline-none focus:border-gray-400"
            >
              <option value="">全部颜色</option>
              {colors.map(color => (
                <option key={color.id} value={color.name}>{color.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : filteredClothes.length === 0 ? (
            <p className="text-xs text-gray-400">
              {clothes.length === 0 ? '暂无衣服，请先添加衣服' : '没有符合条件的衣服'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredClothes.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('clothing', JSON.stringify({
                      id: item.id,
                      image_url: item.image_url,
                      code: item.code
                    }));
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
          <div className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm border-b border-gray-200 select-none" style={{ cursor: 'default' }}>
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

            {/* 操作提示 */}
            <div className="text-xs text-gray-400">
              👉 拖拽衣服到画布 · 点击选中后可拖动或者旋转 · 鼠标滚轮缩放 · 双击删除 👈
            </div>

            <button
              onClick={() => setShowSaveModal(true)}
              disabled={saving || canvasItems.length === 0}
              className="flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-full hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : saveSuccess ? (
                <CheckCircle size={16} className="mr-2 text-green-400" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {saveSuccess ? '已保存' : '保存搭配'}
            </button>
          </div>

          {/* 画布区域 */}
          <div
            ref={canvasRef}
            className="canvas-area flex-1 relative overflow-hidden m-4 rounded-2xl bg-white/30 backdrop-blur border-2 border-dashed border-gray-200"
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
        </div>
      </div>

      {/* 保存搭配弹窗 */}
      {showSaveModal && (
        <SaveOutfitModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSave}
          canvasItems={canvasItems}
        />
      )}
    </div>
  );
}
