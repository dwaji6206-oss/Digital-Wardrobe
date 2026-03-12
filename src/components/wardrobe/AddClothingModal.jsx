/**
 * 添加衣服弹窗组件
 * 支持内联创建服装名称和颜色标签
 */

import { useState } from 'react';
import { useClothingNames } from '../../hooks/useClothingNames';
import { useClothingColors } from '../../hooks/useClothingColors';
import { useClothes } from '../../hooks/useClothes';
import { X, Loader2, Image as ImageIcon, Plus } from 'lucide-react';

export default function AddClothingModal({ onClose, onSuccess }) {
  const { names, addName, fetchNames } = useClothingNames();
  const { colors, addColor, fetchColors } = useClothingColors();
  const { addClothing } = useClothes();

  const [nameId, setNameId] = useState('');
  const [colorId, setColorId] = useState('');
  const [material, setMaterial] = useState('');
  const [length, setLength] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 新建标签弹窗状态
  const [showNameModal, setShowNameModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!nameId || !colorId || !imageFile) {
      setError('请填写名称、颜色并上传图片');
      return;
    }
    setSubmitting(true);
    try {
      await addClothing({ nameId, colorId, material, length, description, imageFile });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // 刷新列表并选中新建的标签
  async function handleNameCreated(newName) {
    await fetchNames();
    setNameId(newName.id);
    setShowNameModal(false);
  }

  async function handleColorCreated(newColor) {
    await fetchColors();
    setColorId(newColor.id);
    setShowColorModal(false);
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      {/* 玻璃弹窗容器 - 固定圆角和边框，滚动在内部 */}
      <div className="glass-modal w-full max-w-lg max-h-[90vh] rounded-3xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-light tracking-wider">添加衣服</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 滚动内容区 */}
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
        <form onSubmit={handleSubmit} className="px-5 pt-5 space-y-5 pb-6">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              衣服图片 <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-gray-300 transition-colors bg-white/30">
              {imagePreview ? (
                <div className="relative p-2 bg-white/30 rounded-xl">
                  <img src={imagePreview} alt="预览" className="max-h-48 mx-auto object-contain rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-1 right-1 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <ImageIcon className="mx-auto text-gray-300 mb-2" size={40} />
                  <p className="text-sm text-gray-500">点击上传图片</p>
                  <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG，最大 10MB</p>
                </label>
              )}
            </div>
            <p className="text-xs text-red-500 mt-2">请上传已从背景抠出的衣服素体图，以确「搭配」功能的使用</p>
          </div>

          {/* 名称选择 + 新建 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">名称 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select
                value={nameId} onChange={(e) => setNameId(e.target.value)} required
                className="select-glass flex-1"
              >
                <option value="">请选择</option>
                {names.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.abbreviation})</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowNameModal(true)}
                className="px-3 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center"
                title="新建名称"
              >
                <Plus size={18} />
              </button>
            </div>
            {/* 固定高度提示语，防止布局抖动 */}
            <p className={`text-xs text-red-500 mt-1 h-4 transition-opacity ${names.length === 0 ? 'opacity-100' : 'opacity-0'}`}>
              请点击 + 添加服装名称
            </p>
          </div>

          {/* 颜色选择 + 新建 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">颜色 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select
                value={colorId} onChange={(e) => setColorId(e.target.value)} required
                className="select-glass flex-1"
              >
                <option value="">请选择</option>
                {colors.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.abbreviation})</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowColorModal(true)}
                className="px-3 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center"
                title="新建颜色"
              >
                <Plus size={18} />
              </button>
            </div>
            {/* 固定高度提示语，防止布局抖动 */}
            <p className={`text-xs text-red-500 mt-1 h-4 transition-opacity ${colors.length === 0 ? 'opacity-100' : 'opacity-0'}`}>
              请点击 + 添加颜色
            </p>
          </div>

          {/* 材质 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">材质</label>
            <input
              type="text" value={material} onChange={(e) => setMaterial(e.target.value)}
              placeholder="如：棉、丝绸、涤纶"
              className="input-glass"
            />
          </div>

          {/* 长度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">长度</label>
            <input
              type="text" value={length} onChange={(e) => setLength(e.target.value)}
              placeholder="如：短款、中款、长款" maxLength={20}
              className="input-glass"
            />
          </div>

          {/* 简介 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">简介</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="添加一些备注..." maxLength={300} rows={3}
              className="input-glass resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{description.length}/300</p>
          </div>

          <button
            type="submit" disabled={submitting}
            className="w-full py-3 btn-primary flex items-center justify-center"
          >
            {submitting ? <><Loader2 className="animate-spin mr-2" size={18} />保存中...</> : '保存衣服'}
          </button>
        </form>
        </div>
      </div>

      {/* 新建名称弹窗 */}
      {showNameModal && (
        <CreateTagModal
          type="名称"
          onClose={() => setShowNameModal(false)}
          onCreate={handleNameCreated}
          onAdd={addName}
        />
      )}

      {/* 新建颜色弹窗 */}
      {showColorModal && (
        <CreateTagModal
          type="颜色"
          onClose={() => setShowColorModal(false)}
          onCreate={handleColorCreated}
          onAdd={addColor}
        />
      )}
    </div>
  );
}

/**
 * 新建标签弹窗组件
 */
function CreateTagModal({ type, onClose, onCreate, onAdd }) {
  const [name, setName] = useState('');
  const [abbr, setAbbr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 验证缩写是否只包含英文字母
  const abbrError = abbr.trim() && !/^[a-zA-Z]+$/.test(abbr);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !abbr.trim() || abbrError) return;

    setSubmitting(true);
    setError(null);
    try {
      const newItem = await onAdd(name, abbr);
      onCreate(newItem);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="glass-modal w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-light tracking-wider mb-4">新建{type}</h3>

        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{type}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`如：${type === '名称' ? '衬衫' : '蓝色'}`}
              maxLength={10}
              className="input-glass"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">缩写</label>
            <input
              type="text"
              value={abbr}
              onChange={(e) => setAbbr(e.target.value)}
              placeholder={`如：${type === '名称' ? 'CS' : 'be'}`}
              maxLength={10}
              className="input-glass"
            />
            {/* 缩写验证提示 - 固定高度防止抖动 */}
            <p className={`text-xs text-red-500 mt-1 h-4 transition-opacity ${abbrError ? 'opacity-100' : 'opacity-0'}`}>
              不支持填入汉字喔~
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              取消
            </button>
            <button type="submit" disabled={submitting || !name.trim() || !abbr.trim() || abbrError} className="flex-1 btn-primary">
              {submitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
