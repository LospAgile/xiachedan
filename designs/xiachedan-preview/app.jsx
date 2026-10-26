import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MessageCircle, Users, Settings2, Search, Plus, Hash, Eye, EyeOff, Wifi, Bell, BellOff, ChevronDown, ChevronRight, ArrowUp, Image, Video, X, Check, Shuffle, PanelLeft, BatteryFull, SlidersHorizontal, Upload, Coffee, Volume2, ArrowLeft } from 'lucide-react';
import { people, initialRooms, initialMessages, IconButton, Shrimp, AppIcon, Avatar, RoomAvatar, Poster, Message, Modal } from './components';

function App() {
  const [view, setView] = useState('chat');
  const [rooms, setRooms] = useState(initialRooms);
  const [messages, setMessages] = useState(initialMessages);
  const [selected, setSelected] = useState('club');
  const [privateMode, setPrivateMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [attachments, setAttachments] = useState({});
  const [modal, setModal] = useState(null);
  const [preview, setPreview] = useState(null);
  const [menu, setMenu] = useState(false);
  const [notification, setNotification] = useState(null);
  const [toast, setToast] = useState('');
  const [me, setMe] = useState(people[0]);
  const [profile, setProfile] = useState(people[0]);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [appVisible, setAppVisible] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const composer = useRef(null);
  const searchField = useRef(null);
  const fileInput = useRef(null);
  const avatarInput = useRef(null);
  const scroll = useRef(null);
  const notificationTimer = useRef(null);
  const toastTimer = useRef(null);
  const objectURLs = useRef([]);
  const room = rooms.find(item => item.id === selected);
  const roomPeople = people.filter(person => room.type === 'direct' ? ['me', selected].includes(person.id) : room.members?.includes(person.id));
  const currentMessages = messages[selected] || [];
  const draft = drafts[selected] || '';
  const attachment = attachments[selected];
  const showToast = text => { setToast(text); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 3200); };
  const closeModal = () => setModal(null);
  const openProfile = () => { setProfile(me); setModal('profile'); };
  function selectRoom(id) {
    setSelected(id); setMenu(false); setModal(null); setView('chat'); setAppVisible(true);
    setRooms(items => items.map(item => item.id === id ? { ...item, unread: 0 } : item));
  }
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'instant' }); }, [selected, currentMessages.length, privateMode, appVisible, view]);
  useEffect(() => {
    const keydown = event => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'p') { event.preventDefault(); setPrivateMode(p => !p); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchField.current?.focus(); }
      if (event.key === 'Escape') { setMenu(false); setPreview(null); }
    };
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('keydown', keydown); clearTimeout(toastTimer.current); clearTimeout(notificationTimer.current); objectURLs.current.forEach(URL.revokeObjectURL); };
  }, []);
  useEffect(() => { if (privateMode) setPreview(null); }, [privateMode]);
  function send(event) {
    event?.preventDefault();
    if (!draft.trim() && !attachment) return;
    composer.current?.focus({ preventScroll: true });
    const message = { id: crypto.randomUUID(), person: 'me', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), text: draft.trim(), ...(attachment || {}) };
    setMessages(items => ({ ...items, [selected]: [...(items[selected] || []), message] }));
    setRooms(items => items.map(item => item.id === selected ? { ...item, preview: `我：${message.text || (message.kind === 'video' ? '[视频]' : '[图片]')}`, time: message.time } : item));
    setDrafts(items => ({ ...items, [selected]: '' })); setAttachments(items => ({ ...items, [selected]: null }));
  }
  function attachFile(event) {
    const file = event.target.files[0]; event.target.value = '';
    if (!file) return;
    if (!/^(image|video)\//.test(file.type)) return showToast('请选择图片或视频。');
    const url = URL.createObjectURL(file); objectURLs.current.push(url);
    setAttachments(items => ({ ...items, [selected]: { kind: file.type.startsWith('video/') ? 'video' : 'image', url, name: file.name } }));
    composer.current?.focus();
  }
  function simulateMessage() {
    const roomId = selected === 'club' ? 'lobby' : 'club';
    const incoming = { id: crypto.randomUUID(), roomId, roomName: rooms.find(item => item.id === roomId).name, person: 'bird', text: '收工前，来虾扯两句？', time: '现在' };
    setMessages(items => ({ ...items, [roomId]: [...(items[roomId] || []), incoming] }));
    setRooms(items => items.map(item => item.id === roomId ? { ...item, time: '现在', preview: `周五限定：${incoming.text}`, unread: item.unread + 1 } : item));
    if (notifications) { setNotification(incoming); clearTimeout(notificationTimer.current); notificationTimer.current = setTimeout(() => setNotification(null), 9000); }
    else showToast('示例消息已送达，弹窗提醒已关闭。');
  }
  function createGroup(event) {
    event.preventDefault(); if (!groupName.trim() || !groupMembers.length) return;
    const id = crypto.randomUUID();
    setRooms(items => [{ id, name: groupName.trim(), count: groupMembers.length + 1, type: 'group', preview: '群聊已创建，来扯两句。', time: '现在', unread: 0, avatar: 'brand', members: ['me', ...groupMembers] }, ...items]);
    setMessages(items => ({ ...items, [id]: [] })); setSelected(id); setFilter('all'); setSearch(''); setModal(null); showToast('群聊已创建。');
  }
  function simulateRead() {
    setMessages(items => ({ ...items, [selected]: (items[selected] || []).map(message => message.person === 'me' ? { ...message, readCount: room.type === 'direct' ? 1 : (room.count || 2) - 1 } : message) }));
    showToast('已模拟对方查看消息，标签已更新。');
  }
  const visibleRooms = rooms.filter(item => item.name.includes(search) && (filter !== 'group' || item.type !== 'direct'));
  return <div className="preview-page">
    <header className="preview-toolbar">
      <div className="preview-identity"><AppIcon /><span>虾扯蛋<small>设计预览</small></span></div>
      <nav className="preview-tabs" aria-label="预览页面">
        <button className={view === 'chat' ? 'active' : ''} onClick={() => setView('chat')}>聊天界面</button>
        <button className={view === 'identity' ? 'active' : ''} onClick={() => setView('identity')}>图标与品牌</button>
      </nav>
      <button className="preview-action" onClick={simulateRead}><Check size={15} /><span>模拟已读</span></button>
      <button className="preview-action" onClick={simulateMessage}><Bell size={15} /><span>模拟新消息</span></button>
    </header>
    <div className={`desktop-stage ${view === 'identity' ? 'identity-stage' : ''}`} data-screen-label={view === 'chat' ? '虾扯蛋 · 聊天预览' : '虾扯蛋 · 图标与品牌'}>
      <div className="mac-menu-bar">
        <div className="mac-menu-left"><b>虾扯蛋</b><span>文件</span><span>编辑</span><span>窗口</span><span>帮助</span></div>
        <div className="mac-menu-right">
          <button aria-label="打开虾扯蛋菜单栏" title="虾扯蛋菜单栏" className={`tray-icon ${menu ? 'selected' : ''}`} onClick={() => setMenu(value => !value)}><Shrimp />{rooms.some(item => item.unread > 0) && <i />}</button>
          <Wifi size={15} /><BatteryFull size={20} /><span>周一 15:42</span>
        </div>
      </div>
      {menu && <><button className="menu-dismiss" aria-label="收起菜单" onClick={() => setMenu(false)} /><div className="tray-menu">
        <div className="tray-heading"><AppIcon /><div><b>虾扯蛋</b><small>有事说事，没事虾扯蛋。</small></div></div>
        <button onClick={() => { setView('chat'); setAppVisible(true); setMenu(false); }}><MessageCircle size={16} />打开聊天窗口<ChevronRight size={14} /></button>
        <hr /><button onClick={() => setPrivateMode(v => !v)}>{privateMode ? <EyeOff size={16} /> : <Eye size={16} />}隐私模式<Check size={15} style={{ opacity: privateMode ? 1 : 0 }} /></button>
        <button onClick={() => setNotifications(v => !v)}><Bell size={16} />新消息弹窗<Check size={15} style={{ opacity: notifications ? 1 : 0 }} /></button>
        <hr /><div className="tray-foot"><Wifi size={13} />局域网聊天 · 预览</div>
      </div></>}
      {view === 'chat' && (appVisible ? <section className={`app-window ${sidebarVisible ? '' : 'sidebar-collapsed'}`}>
        <header className="window-titlebar"><div className="traffic-lights" aria-label="窗口控件">
          <button className="close" aria-label="收起到菜单栏" onClick={() => setAppVisible(false)} /><button className="minimize" aria-label="最小化预览窗口" onClick={() => setAppVisible(false)} /><button className="expand" aria-label="切换侧栏显示" onClick={() => setSidebarVisible(v => !v)} />
        </div><span className="window-title">虾扯蛋</span><span className="window-subtitle">有事说事，没事虾扯蛋。</span><IconButton label="切换侧栏" onClick={() => setSidebarVisible(v => !v)}><PanelLeft size={15} /></IconButton></header>
        <div className="app-body">
          <nav className="app-rail" aria-label="应用导航">
            <button className="rail-logo" onClick={() => setView('identity')} title="虾扯蛋图标与品牌"><AppIcon /></button>
            <IconButton label="聊天" className="rail-active" onClick={() => { setFilter('all'); setSidebarVisible(true); }}><MessageCircle size={21} /></IconButton>
            <IconButton label="局域网成员" onClick={() => setModal('members')}><Users size={21} /></IconButton>
            <div className="rail-spacer" />
            <IconButton label="设置" onClick={() => setModal('settings')}><Settings2 size={20} /></IconButton>
            <button className="rail-profile" aria-label="编辑我的昵称和头像" onClick={openProfile}><Avatar person={me} size={34} /><i /></button>
          </nav>
          <aside className="conversation-sidebar">
            <div className="sidebar-heading"><div><h1>虾扯蛋<span className="brand-period">.</span></h1><p>有事说事，没事虾扯蛋。</p></div><IconButton label="创建群聊" onClick={() => { setGroupName(''); setGroupMembers([]); setModal('group'); }}><Plus size={18} /></IconButton></div>
            <label className="search-field"><Search size={15} /><input ref={searchField} aria-label="搜索聊天" value={search} onChange={e => setSearch(e.target.value)} placeholder="找个人，扯两句" /><kbd>⌘ K</kbd></label>
            <div className="conversation-tabs"><button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>全部消息<span>{rooms.length}</span></button><button onClick={() => setFilter('group')} className={filter === 'group' ? 'active' : ''}>群聊</button></div>
            <div className="conversation-list">
              <div className="list-caption">最近聊天</div>
              {visibleRooms.map(item => <button key={item.id} className={`conversation ${item.id === selected ? 'selected' : ''}`} onClick={() => selectRoom(item.id)}>
                <RoomAvatar room={item} /><span className="conversation-copy"><span className="conversation-top"><b>{item.name}</b><time>{item.time}</time></span><span className="conversation-preview">{privateMode ? '****' : item.preview}</span></span>{item.unread > 0 && <span className="unread-badge" aria-label={`${item.unread} 条未读消息`} title={`${item.unread} 条未读消息`}>{item.unread > 99 ? '99+' : item.unread}</span>}
              </button>)}
              {!visibleRooms.length && <div className="empty-search">没找到这个聊天，换个名字试试。</div>}
            </div>
            <button className="sidebar-bottom" onClick={() => setModal('connection')}><span className="connection-icon"><Wifi size={17} /></span><span><b>同一网络，即刻开聊</b><small>办公室 · 局域网空间</small></span><ChevronRight size={14} /></button>
          </aside>
          <main className="chat-panel">
            <header className="chat-header"><div className="chat-heading"><div><h2>{room.name}</h2><span className="type-label">{room.type === 'direct' ? '私聊' : room.type === 'public' ? '公共' : '群聊'}</span></div><p>{room.type === 'direct' ? `${people.find(p => p.id === selected)?.online ? '对方在线' : '对方离线'} · 同一局域网` : `${room.count} 位成员 · ${roomPeople.filter(p => p.online).length} 人在线`}</p></div>
              <div className="chat-header-actions"><button className={`privacy-control ${privateMode ? 'enabled' : ''}`} role="switch" aria-checked={privateMode} aria-label="隐私模式" onClick={() => setPrivateMode(v => !v)}>{privateMode ? <EyeOff size={16} /> : <Eye size={16} />}<span>隐私模式</span><span className="toggle-track"><span /></span></button><span className="header-separator" /><IconButton label="查看聊天成员" onClick={() => setModal('room-members')}><Users size={20} /></IconButton></div>
            </header>
            {privateMode ? <div className="privacy-notice"><EyeOff size={14} /><span>消息已隐藏，移入查看，移开收起。</span><kbd>⌘ ⇧ P</kbd></div> : <div className="room-notice"><Volume2 size={14} /><span>{room.type === 'direct' ? '在同一个局域网里，随时扯两句。' : '有空冒个泡，忙的时候安心潜水。'}</span></div>}
            <div className="messages" ref={scroll}><div className="date-divider"><span />今天，10 月 26 日<span /></div>
              {currentMessages.length ? currentMessages.map(message => <Message key={message.id} message={message} privateMode={privateMode} me={me} onPreview={setPreview} room={room} />) : <div className="empty-chat"><Shrimp /><h3>群有了，就差你开个头。</h3><p>发条消息，大家一起虾扯蛋。</p></div>}
            </div>
            <form className="composer-area" onSubmit={send}>
              <div className="composer-box">{attachment && <div className="attachment-chip">{attachment.kind === 'image' ? <Image size={14} /> : <Video size={14} />}<span>{attachment.name}</span><IconButton label="移除附件" onClick={() => setAttachments(items => ({ ...items, [selected]: null }))}><X size={13} /></IconButton></div>}
                <textarea ref={composer} aria-label="消息输入框" placeholder="来，随便扯两句…" value={draft} rows="2" onChange={e => setDrafts(items => ({ ...items, [selected]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) send(e); }} />
                <div className="composer-controls"><div className="attachment-actions"><button type="button" onClick={() => { fileInput.current.accept = 'image/*'; fileInput.current.click(); }}><Image size={17} /><span>图片</span></button><button type="button" onClick={() => { fileInput.current.accept = 'video/*'; fileInput.current.click(); }}><Video size={18} /><span>视频</span></button></div><div className="send-actions"><span>Enter 发送<span className="shortcut-divider">/</span>Shift + Enter 换行</span><button className="send-button" type="submit" aria-label="发送消息" disabled={!draft.trim() && !attachment}>发送<ArrowUp size={15} /></button></div></div>
              </div><div className="composer-footnote"><span><Shrimp />只在局域网里，放轻松聊。</span><span>虾扯蛋</span></div>
            </form>
          </main>
        </div>
      </section> : <div className="hidden-app"><AppIcon /><h2>虾扯蛋还在这里。</h2><p>点击右上角的小虾，随时回来扯两句。</p><button className="primary-button" onClick={() => setAppVisible(true)}>打开聊天窗口</button></div>)}
      {view === 'identity' && <section className="identity-board">
        <div className="identity-intro"><span className="eyebrow">一个有点随意的聊天工具</span><h1>有事说事，<br />没事<span>虾扯蛋。</span></h1><p>一只虾，一群人。<br />在同一个局域网里，扯点有的没的。</p><button className="text-button" onClick={() => setView('chat')}><ArrowLeft size={15} />回到聊天预览</button></div>
        <div className="icon-showcase"><div className="app-icon-stage"><AppIcon /><span>虾扯蛋</span><small>暖白虾形 / 虾橙底色</small></div><div className="icon-sizes"><AppIcon className="size-64" /><AppIcon className="size-48" /><AppIcon className="size-32" /><AppIcon className="size-24" /><span>每个尺寸，都能认出来。</span></div></div>
        <div className="menu-icon-showcase"><div className="showcase-heading"><span>菜单栏里的那只虾</span><small>简化轮廓，保留虾须与分节虾身</small></div><div className="menu-sample light"><Shrimp /><Wifi size={16} /><BatteryFull size={21} /><span>周一 15:42</span></div><div className="menu-sample dark"><Shrimp /><Wifi size={16} /><BatteryFull size={21} /><span>周一 15:42</span></div><div className="menu-caption"><span className="color-dot orange" /><span>虾橙</span><span className="color-dot white" /><span>暖白</span><span className="color-dot ink" /><span>墨色</span></div></div>
      </section>}
      {notification && <button className="notification" aria-label="打开新消息" onClick={() => { selectRoom(notification.roomId); setNotification(null); }}><AppIcon /><span><span className="notification-title"><b>虾扯蛋</b><small>现在</small></span><strong>{privateMode ? '你收到一条新消息' : `周五限定 · ${notification.roomName}`}</strong><span className="notification-body">{privateMode ? '****' : notification.text}</span></span></button>}
    </div>
    <footer className="preview-footer"><span><span className="preview-dot" />暖白 + 虾橙<span className="footer-divider">/</span>交互预览 · 示例消息</span><span>点「模拟新消息」看角标，打开对应会话后清除。</span></footer>
    <input ref={fileInput} className="visually-hidden" type="file" accept="image/*,video/*" onChange={attachFile} tabIndex={-1} />
    <input ref={avatarInput} className="visually-hidden" type="file" accept="image/*" tabIndex={-1} onChange={event => { const file = event.target.files[0]; event.target.value = ''; if (!file?.type.startsWith('image/')) return; const image = URL.createObjectURL(file); objectURLs.current.push(image); setProfile(p => ({ ...p, image })); }} />
    {modal === 'profile' && <Modal title="换个身份，继续扯蛋。" subtitle="起个昵称，再挑一个顺眼的头像。" onClose={closeModal}><form onSubmit={event => { event.preventDefault(); if (!profile.name.trim()) return; setMe({ ...profile, name: profile.name.trim() }); setModal(null); showToast('新身份已就位。'); }}>
      <div className="profile-photo"><Avatar person={profile} size={80} /><button type="button" className="secondary-button" onClick={() => avatarInput.current.click()}><Upload size={14} />上传头像</button></div>
      <div className="avatar-options">{people.map(person => <button type="button" key={person.id} className={profile.avatar === person.avatar && !profile.image ? 'selected' : ''} aria-label={`选择${person.avatar}头像`} onClick={() => setProfile(p => ({ ...p, avatar: person.avatar, color: person.color, image: null }))}><Avatar person={person} size={40} /></button>)}</div>
      <label className="form-label" htmlFor="nickname">你的昵称</label><div className="nickname-input"><input id="nickname" value={profile.name} maxLength={20} required onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} /><button type="button" aria-label="随机有趣昵称" title="随机来一个" onClick={() => { const names = ['带薪发呆的虾', '虾班再说', '在逃荷包蛋', '一只靠谱的虾', '不想加班的虾']; const choices = names.filter(name => name !== profile.name); setProfile(p => ({ ...p, name: choices[Math.floor(Math.random() * choices.length)] })); }}><Shuffle size={17} /></button></div><p className="form-hint">没灵感？点一下右边，随机来一个。</p><button className="primary-button full" type="submit">就用这个</button>
    </form></Modal>}
    {modal === 'group' && <Modal title="拉个群，一起虾扯蛋。" subtitle="选几个同一局域网里的朋友。" onClose={closeModal}><form onSubmit={createGroup}><label className="form-label" htmlFor="group-name">群聊名称</label><input className="form-input" id="group-name" placeholder="比如：虾班研究所" maxLength={24} value={groupName} required onChange={event => setGroupName(event.target.value)} autoFocus /><div className="member-label">选择成员<small>已选 {groupMembers.length} 人</small></div><div className="member-picker">{people.filter(p => p.id !== 'me').map(person => <label key={person.id} className="member-option"><Avatar person={person} /><span><b>{person.name}</b><small>{person.online ? '在线' : '离线'}</small></span><input type="checkbox" checked={groupMembers.includes(person.id)} onChange={e => setGroupMembers(items => e.target.checked ? [...items, person.id] : items.filter(id => id !== person.id))} /></label>)}</div><button className="primary-button full" type="submit" disabled={!groupName.trim() || !groupMembers.length}>创建群聊</button></form></Modal>}
    {(modal === 'members' || modal === 'room-members') && <Modal title={modal === 'members' ? '同网的朋友' : room.name} subtitle="改个昵称，也能一眼认出自己人。" onClose={closeModal}><div className="member-picker">{(room.members && modal === 'room-members' ? people.filter(person => room.members.includes(person.id)) : modal === 'room-members' && room.type === 'direct' ? people.filter(person => ['me', selected].includes(person.id)) : people).map(person => <div className="member-option" key={person.id}><Avatar person={person.id === 'me' ? me : person} /><span><b>{person.id === 'me' ? me.name : person.name}{person.id === 'me' ? '（我）' : ''}</b><small>{person.online ? '在线' : '离线'}</small></span>{person.id !== 'me' && <button className="text-button" onClick={() => { if (!rooms.some(item => item.id === person.id)) setRooms(items => [...items, { id: person.id, name: person.name, type: 'direct', preview: '来打个招呼吧。', time: '现在', unread: 0, avatar: person.id }]); selectRoom(person.id); }}>聊两句<ChevronRight size={13} /></button>}</div>)}</div></Modal>}
    {modal === 'settings' && <Modal title="聊得自在一点。" subtitle="按你的习惯调整。" onClose={closeModal}><div className="setting-row"><EyeOff size={20} /><span><b>隐私模式</b><small>内容变成 ****，悬停才显示。</small></span><button className={`standalone-switch ${privateMode ? 'on' : ''}`} role="switch" aria-checked={privateMode} aria-label="设置隐私模式" onClick={() => setPrivateMode(v => !v)}><span /></button></div><div className="setting-row"><Bell size={20} /><span><b>新消息弹窗</b><small>隐私模式下，弹窗也隐藏内容。</small></span><button className={`standalone-switch ${notifications ? 'on' : ''}`} role="switch" aria-checked={notifications} aria-label="新消息弹窗" onClick={() => setNotifications(v => !v)}><span /></button></div><button className="secondary-button full" onClick={() => { closeModal(); simulateMessage(); }}>试一下新消息提醒</button></Modal>}
    {modal === 'connection' && <Modal title="同一个网络，同一群朋友。" subtitle="这是独立的界面预览，下面的连接信息是示例。" onClose={closeModal}><div className="connection-card"><Wifi size={30} /><div><b>办公室</b><span>局域网空间 · 5 位成员</span></div></div><p className="connection-note">正式应用里，朋友加入同一空间后，就可以发送文字、图片和视频。</p><button className="primary-button full" onClick={closeModal}>知道了</button></Modal>}
    {preview && <Modal title={preview === 'poster' ? '虾扯蛋 · 品牌海报' : preview.name} onClose={() => setPreview(null)} className="image-modal">{preview === 'poster' ? <Poster large /> : <img className="full-image" src={preview.url} alt={preview.name} />}</Modal>}
    {toast && <div className="toast" role="status"><Check size={15} />{toast}</div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
