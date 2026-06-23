import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  addGroupMember,
  leaveGroup,
  removeGroupMember,
  updateGroupConversation,
  uploadGroupAvatar,
} from '../../services/conversationService';
import { getConversationAvatar, getMemberDisplay } from '../../utils/conversationHelpers';

export default function GroupInfoModal({
  open,
  conversation,
  currentUserId,
  friends = [],
  onClose,
  onConversationUpdate,
  onLeave,
  onStartGroupCall,
}) {
  const avatarInputRef = useRef(null);
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (conversation) {
      setGroupName(conversation.name || '');
      setSearchTerm('');
      setError('');
    }
  }, [conversation]);

  const members = conversation?.members || [];
  const memberIds = useMemo(
    () => new Set(members.map((member) => member.userId)),
    [members],
  );

  const addableFriends = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return friends.filter((friend) => {
      if (memberIds.has(friend.id)) return false;
      if (!query) return true;
      return (
        friend.displayName?.toLowerCase().includes(query)
        || friend.email?.toLowerCase().includes(query)
      );
    });
  }, [friends, memberIds, searchTerm]);

  if (!open || !conversation) return null;

  const currentMember = members.find((member) => member.userId === currentUserId);
  const isAdmin = currentMember?.role === 'ADMIN';
  const avatarUrl = getConversationAvatar(conversation, currentUserId);

  const handleSaveName = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName || trimmedName === conversation.name) return;

    setIsSavingName(true);
    setError('');
    try {
      const response = await updateGroupConversation(conversation.id, { name: trimmedName });
      if (response?.success && response?.data) {
        onConversationUpdate?.(response.data);
      } else {
        setError(response?.message || 'Không thể cập nhật tên nhóm.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật tên nhóm.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploadingAvatar(true);
    setError('');
    try {
      const response = await uploadGroupAvatar(conversation.id, file);
      if (response?.success && response?.data) {
        onConversationUpdate?.(response.data);
      } else {
        setError(response?.message || 'Không thể tải avatar nhóm.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải avatar nhóm.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAddMember = async (friend) => {
    setAddingMemberId(friend.id);
    setError('');
    try {
      const response = await addGroupMember(conversation.id, friend.id);
      if (response?.success && response?.data) {
        onConversationUpdate?.(response.data);
        setSearchTerm('');
      } else {
        setError(response?.message || 'Không thể thêm thành viên.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể thêm thành viên.');
    } finally {
      setAddingMemberId(null);
    }
  };

  const handleRemoveMember = async (member) => {
    const display = getMemberDisplay(member);
    const confirmed = window.confirm(`Xóa ${display.name} khỏi nhóm?`);
    if (!confirmed) return;

    setRemovingMemberId(member.userId);
    setError('');
    try {
      const response = await removeGroupMember(conversation.id, member.userId);
      if (response?.success && response?.data) {
        onConversationUpdate?.(response.data);
      } else {
        setError(response?.message || 'Không thể xóa thành viên.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa thành viên.');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleLeaveGroup = async () => {
    const confirmed = window.confirm('Bạn có chắc muốn rời nhóm này?');
    if (!confirmed) return;

    setIsLeaving(true);
    setError('');
    try {
      const response = await leaveGroup(conversation.id, currentUserId);
      if (response?.success) {
        onLeave?.();
        onClose?.();
      } else {
        setError(response?.message || 'Không thể rời nhóm.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể rời nhóm.');
    } finally {
      setIsLeaving(false);
    }
  };

  const getFriendAvatar = (friend) =>
    friend.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName || 'User')}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <header className="px-5 py-4 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Thông tin nhóm</h3>
            <p className="text-xs text-outline">{members.length} thành viên</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={conversation.name || 'Nhóm'}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/10"
              />
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 bg-primary p-2 rounded-full shadow-lg border-2 border-white text-white disabled:opacity-50"
                    title="Đổi avatar nhóm"
                  >
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>
            {isUploadingAvatar && (
              <p className="text-xs text-primary font-medium">Đang tải avatar...</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tên nhóm</label>
            {isAdmin ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                  maxLength={100}
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={isSavingName || !groupName.trim() || groupName.trim() === conversation.name}
                  className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-40"
                >
                  {isSavingName ? '...' : 'Lưu'}
                </button>
              </div>
            ) : (
              <p className="px-4 py-2.5 rounded-xl bg-surface-container-low text-sm font-semibold">
                {conversation.name || 'Nhóm chat'}
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thêm thành viên</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm bạn bè..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {addableFriends.length > 0 ? (
                  addableFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container-low">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={getFriendAvatar(friend)} alt={friend.displayName} className="w-9 h-9 rounded-full object-cover" />
                        <p className="text-sm font-semibold truncate">{friend.displayName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddMember(friend)}
                        disabled={addingMemberId === friend.id}
                        className="px-3 py-1 rounded-full border border-primary text-primary text-[11px] font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-40"
                      >
                        {addingMemberId === friend.id ? '...' : 'Thêm'}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-outline text-center py-2">Không còn bạn bè để thêm.</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thành viên</label>
            <div className="space-y-1">
              {members.map((member) => {
                const display = getMemberDisplay(member);
                const isMe = member.userId === currentUserId;
                const isMemberAdmin = member.role === 'ADMIN';
                const canRemove = isAdmin && !isMe;

                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low"
                  >
                    <img src={display.avatar} alt={display.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {display.name}
                        {isMe ? ' (Bạn)' : ''}
                      </p>
                      <p className="text-[11px] text-outline">
                        {isMemberAdmin ? 'Quản trị viên' : 'Thành viên'}
                      </p>
                    </div>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member)}
                        disabled={removingMemberId === member.userId}
                        className="p-2 rounded-full text-error hover:bg-red-50 disabled:opacity-40"
                        title="Xóa khỏi nhóm"
                      >
                        <span className="material-symbols-outlined text-[20px]">person_remove</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-error text-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onStartGroupCall?.('AUDIO')}
              className="py-3 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
              Gọi thoại nhóm
            </button>
            <button
              type="button"
              onClick={() => onStartGroupCall?.('VIDEO')}
              className="py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">videocam</span>
              Gọi video nhóm
            </button>
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-outline-variant shrink-0">
          <button
            type="button"
            onClick={handleLeaveGroup}
            disabled={isLeaving}
            className="w-full py-3 rounded-xl border border-error text-error font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {isLeaving ? 'Đang rời nhóm...' : 'Rời nhóm'}
          </button>
        </footer>
      </div>
    </div>
  );
}
