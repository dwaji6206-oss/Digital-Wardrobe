import { useState, useMemo } from 'react';
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

  // 过滤后的衣服列表
  const filteredClothes = useMemo(() => {
    return clothes.filter(item => {
      const matchName = !filterName || item.clothing_names?.name === filterName;
      const matchColor = !filterColor || item.clothing_colors?.name === filterColor;
      return matchName && matchColor;
    });
  }, [clothes, filterName, filterColor]);

  async function handleDelete(id) {
    try {
      await deleteClothing(id);
      setSelectedClothing(null);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 select-none" style={{ cursor: 'default' }}>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 select-none" style={{ cursor: 'default' }}>
            {filteredClothes.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedClothing(item)}
                className="group relative bg-gray-100/50 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 rounded-2xl p-2"
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
            ))}
          </div>
        )}
      </div>

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
