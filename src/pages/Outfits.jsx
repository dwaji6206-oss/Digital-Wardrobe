/**
 * 我的搭配页面
 * 展示所有保存的搭配，支持按季节和风格筛选
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import OutfitDetailModal from '../components/outfit/OutfitDetailModal';
import { useOutfits } from '../hooks/useOutfits';
import { Plus, Loader2, Sparkles } from 'lucide-react';

export default function Outfits() {
  const navigate = useNavigate();
  const { outfits, loading, error, deleteOutfit, fetchOutfits } = useOutfits();
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [filterSeason, setFilterSeason] = useState('');
  const [filterStyle, setFilterStyle] = useState('');

  // 从现有搭配中提取所有季节和风格选项
  const { seasons, styles } = useMemo(() => {
    const seasonSet = new Set();
    const styleSet = new Set();
    outfits.forEach(outfit => {
      if (outfit.season) seasonSet.add(outfit.season);
      if (outfit.style) styleSet.add(outfit.style);
    });
    return {
      seasons: Array.from(seasonSet).sort(),
      styles: Array.from(styleSet).sort()
    };
  }, [outfits]);

  // 过滤后的搭配列表
  const filteredOutfits = useMemo(() => {
    return outfits.filter(outfit => {
      const matchSeason = !filterSeason || outfit.season === filterSeason;
      const matchStyle = !filterStyle || outfit.style === filterStyle;
      return matchSeason && matchStyle;
    });
  }, [outfits, filterSeason, filterStyle]);

  async function handleDelete(id) {
    try {
      await deleteOutfit(id);
      setSelectedOutfit(null);
    } catch (err) {
      alert(err.message);
    }
  }

  // 更新搭配（用于反馈图片更新后同步状态）
  function handleUpdateOutfit(updatedOutfit) {
    setSelectedOutfit(updatedOutfit);
  }

  // 格式化日期
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-gray-50 select-none" style={{ cursor: 'default' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 标题和新建按钮 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-light tracking-wider text-gray-900">我的搭配</h1>
          <button
            onClick={() => navigate('/canvas')}
            className="btn-primary flex items-center"
          >
            <Plus size={18} className="mr-2" />
            新建搭配
          </button>
        </div>

        {/* 筛选栏 */}
        {outfits.length > 0 && (
          <div className="glass rounded-2xl p-4 mb-6">
            {/* 季节筛选 */}
            {seasons.length > 0 && (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-500 font-medium shrink-0">季节</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterSeason('')}
                    className={`pill ${!filterSeason ? 'pill-active' : 'pill-inactive'}`}
                  >
                    全部
                  </button>
                  {seasons.map(season => (
                    <button
                      key={season}
                      onClick={() => setFilterSeason(season)}
                      className={`pill ${filterSeason === season ? 'pill-active' : 'pill-inactive'}`}
                    >
                      {season}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 风格筛选 */}
            {styles.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 font-medium shrink-0">风格</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterStyle('')}
                    className={`pill ${!filterStyle ? 'pill-active' : 'pill-inactive'}`}
                  >
                    全部
                  </button>
                  {styles.map(style => (
                    <button
                      key={style}
                      onClick={() => setFilterStyle(style)}
                      className={`pill ${filterStyle === style ? 'pill-active' : 'pill-inactive'}`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

        {/* 加载状态 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : filteredOutfits.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Sparkles size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-400 mb-2">
              {outfits.length === 0 ? '还没有保存任何搭配' : '没有符合条件的搭配'}
            </p>
            {outfits.length === 0 && (
              <button
                onClick={() => navigate('/canvas')}
                className="text-gray-900 underline hover:no-underline"
              >
                去创建第一套搭配
              </button>
            )}
          </div>
        ) : (
          /* 搭配网格 */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 select-none" style={{ cursor: 'default' }}>
            {filteredOutfits.map((outfit) => (
              <div
                key={outfit.id}
                onClick={() => setSelectedOutfit(outfit)}
                className="group relative bg-white/60 backdrop-blur-sm overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 rounded-2xl border border-white/40"
              >
                {/* 搭配图片 */}
                <div className="aspect-[3/4] bg-gray-100/50">
                  <img
                    src={outfit.image_url}
                    alt={outfit.title || '搭配'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* 底部信息 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                  <h3 className="text-white font-medium text-sm truncate">
                    {outfit.title || '我的搭配'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {(outfit.season || outfit.style) && (
                      <span className="text-white/70 text-xs">
                        {[outfit.season, outfit.style].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    <span className="text-white/50 text-xs ml-auto">
                      {formatDate(outfit.created_at)}
                    </span>
                  </div>
                </div>

                {/* 衣服数量标签 */}
                {outfit.clothes_ids?.length > 0 && (
                  <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-gray-600 font-medium">
                    {outfit.clothes_ids.length}件
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 搭配详情弹窗 */}
      {selectedOutfit && (
        <OutfitDetailModal
          outfit={selectedOutfit}
          onClose={() => setSelectedOutfit(null)}
          onDelete={handleDelete}
          onUpdateOutfit={handleUpdateOutfit}
        />
      )}
    </div>
  );
}
