import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useFriendStore from '../../store/friendStore';
import useChatStore from '../../store/chatStore';
import { createGroupConversation, uploadGroupAvatar } from '../../services/conversationService';

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const { friends, loadFriends } = useFriendStore();
  const { upsertConversation, setActiveConversation } = useChatStore();

  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarInputRef = useRef(null);

  useEffect(() => {
    loadFriends().catch(() => {});
  }, [loadFriends]);

  const availableFriends = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return friends.filter((friend) => {
      if (selectedMembers.some((member) => member.id === friend.id)) return false;
      if (!query) return true;
      return (
        friend.displayName?.toLowerCase().includes(query)
        || friend.email?.toLowerCase().includes(query)
      );
    });
  }, [friends, searchTerm, selectedMembers]);

  const toggleMember = (member) => {
    setSelectedMembers((current) => {
      if (current.some((item) => item.id === member.id)) {
        return current.filter((item) => item.id !== member.id);
      }
      return [...current, member];
    });
  };

  const canSubmit = groupName.trim().length > 0 && selectedMembers.length >= 1 && !isSubmitting;

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCreateGroup = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await createGroupConversation(
        groupName.trim(),
        selectedMembers.map((member) => member.id),
      );

      if (!response?.success || !response?.data) {
        setError(response?.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
        return;
      }

      let conversation = response.data;

      if (avatarFile) {
        try {
          const avatarResponse = await uploadGroupAvatar(conversation.id, avatarFile);
          if (avatarResponse?.success && avatarResponse?.data) {
            conversation = avatarResponse.data;
          }
        } catch (avatarErr) {
          console.warn('Group created but avatar upload failed:', avatarErr);
        }
      }

      upsertConversation(conversation);
      setActiveConversation(conversation);
      navigate('/chat/window');
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.response?.data?.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFriendAvatar = (friend) =>
    friend.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName || 'User')}`;

  return (
    <div className="flex-1 h-screen bg-surface-bright relative">
      <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
          <header className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-xl font-bold">Tạo nhóm mới</h2>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-24 h-24 bg-surface-container rounded-full flex items-center justify-center ring-4 ring-primary/5 overflow-hidden hover:opacity-90 transition-opacity"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar nhóm" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-[40px]">groups</span>
                )}
                <div className="absolute bottom-0 right-0 bg-primary p-2 rounded-full shadow-lg border-2 border-white text-white">
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </div>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <span className="mt-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                {avatarPreview ? 'Đổi ảnh nhóm' : 'Chọn ảnh nhóm (tuỳ chọn)'}
              </span>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên nhóm</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-sm"
                  placeholder="Nhập tên nhóm..."
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thêm thành viên</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-surface-container-low border border-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all text-sm"
                    placeholder="Tìm trong danh sách bạn bè..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                Bạn bè ({availableFriends.length})
              </h4>
              <div className="space-y-1">
                {availableFriends.length > 0 ? (
                  availableFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-2 hover:bg-surface-container-low rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getFriendAvatar(friend)}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant/30"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{friend.displayName}</p>
                          <p className="text-[11px] text-outline truncate">{friend.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleMember(friend)}
                        className="px-4 py-1.5 rounded-full border border-primary text-primary text-[11px] font-bold hover:bg-primary hover:text-white transition-all shrink-0"
                      >
                        Thêm
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-outline py-4 text-center">
                    {friends.length === 0
                      ? 'Bạn chưa có bạn bè để thêm vào nhóm.'
                      : 'Không tìm thấy bạn bè phù hợp.'}
                  </p>
                )}
              </div>
            </div>

            {selectedMembers.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Đã chọn ({selectedMembers.length})
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex-shrink-0 flex items-center gap-2 bg-primary/10 pr-2 pl-1 py-1 rounded-full border border-primary/20"
                    >
                      <img
                        src={getFriendAvatar(member)}
                        className="w-8 h-8 rounded-full object-cover"
                        alt={member.displayName}
                      />
                      <span className="text-[11px] font-bold text-primary truncate max-w-[80px]">
                        {member.displayName}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleMember(member)}
                        className="flex items-center justify-center text-primary/50 hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer className="px-6 py-6 border-t border-outline-variant bg-white space-y-4">
            {!groupName.trim() && (
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <p className="text-[11px] font-bold uppercase tracking-wider">Vui lòng nhập tên nhóm</p>
              </div>
            )}
            {groupName.trim() && selectedMembers.length < 1 && (
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <p className="text-[11px] font-bold uppercase tracking-wider">Chọn ít nhất 1 thành viên</p>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <p className="text-[11px] font-bold">{error}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={!canSubmit}
                className="w-full py-4 rounded-xl text-white font-bold text-sm bg-primary shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang tạo nhóm...' : 'Tạo nhóm'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full py-3 rounded-xl text-primary font-bold text-sm hover:bg-surface-container-low transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
