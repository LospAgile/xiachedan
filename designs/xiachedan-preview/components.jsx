import React, { useEffect, useRef, useState } from 'react';
import { Cat, Fish, Bird, Rabbit, Coffee, Mountain, EyeOff, X, Check, ArrowUpRight } from 'lucide-react';

export const people = [
  { id: 'me', name: '不想加班的虾', avatar: 'cat', color: 'peach', online: true },
  { id: 'fish', name: '摸鱼研究员', avatar: 'fish', color: 'sage', online: true },
  { id: 'bird', name: '周五限定', avatar: 'bird', color: 'blue', online: true },
  { id: 'rabbit', name: '半熟荷包蛋', avatar: 'rabbit', color: 'lilac', online: false },
  { id: 'coffee', name: '拿铁不加班', avatar: 'coffee', color: 'sand', online: false },
];
export const initialRooms = [
  { id: 'club', name: '虾扯蛋小分队', type: 'group', count: 5, members: people.map(p => p.id), preview: '我：这个名字，一听就是自己人。', time: '15:40', unread: 0, avatar: 'brand' },
  { id: 'lobby', name: '局域网大厅', type: 'public', count: 5, members: people.map(p => p.id), preview: '拿铁不加班：有人要一起点咖啡吗？', time: '15:38', unread: 2, avatar: 'coffee' },
  { id: 'lunch', name: '今天吃点啥', type: 'group', count: 3, members: ['me', 'rabbit', 'coffee'], preview: '半熟荷包蛋：今天想吃点热乎的。', time: '15:26', unread: 0, avatar: 'coffee' },
  { id: 'fish', name: '摸鱼研究员', type: 'direct', preview: '这个虾头像，我先用上了。', time: '14:56', unread: 1, avatar: 'fish' },
  { id: 'bird', name: '周五限定', type: 'direct', preview: '明天见。', time: '昨天', unread: 0, avatar: 'bird' },
];
export const initialMessages = {
  club: [
    { id: 'm1', person: 'fish', text: '新群开张。工作可以正经，群名必须随意。', time: '15:36' },
    { id: 'm2', person: 'bird', kind: 'poster', time: '15:38' },
    { id: 'm3', person: 'me', text: '通过。这个名字，一听就是自己人。', time: '15:40', readCount: 2 },
  ],
  lobby: [{ id: 'l0', person: 'coffee', text: '下午茶时间到了。', time: '15:37' }, { id: 'l1', person: 'coffee', text: '有人要一起点咖啡吗？', time: '15:38' }],
  lunch: [{ id: 'e1', person: 'rabbit', text: '今天想吃点热乎的。', time: '15:26' }, { id: 'e2', person: 'me', text: '火锅可以，等我五分钟。', time: '15:27' }],
  fish: [{ id: 'f0', person: 'me', text: '新头像已经安排上了。', time: '14:55', readCount: 1 }, { id: 'f1', person: 'fish', text: '这个虾头像，我先用上了。', time: '14:56' }],
  bird: [{ id: 'b1', person: 'bird', text: '明天见。', time: '昨天 18:01' }],
};
export function IconButton({ label, children, className = '', ...props }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}
export function Shrimp({ className = '' }) {
  return <img className={`shrimp-mark ${className}`} src="./assets/shrimp.svg" alt="" draggable="false" />;
}
export function AppIcon({ className = '' }) {
  return <img className={`app-icon ${className}`} src="./assets/app-icon.svg" alt="虾扯蛋应用图标" draggable="false" />;
}
export function Avatar({ person, size = 36, className = '' }) {
  const icons = { cat: Cat, fish: Fish, bird: Bird, rabbit: Rabbit, coffee: Coffee, mountain: Mountain };
  const Icon = icons[person?.avatar] || Cat;
  return <span className={`avatar ${person?.color || 'peach'} ${className}`} style={{ width: size, height: size }}>
    {person?.image ? <img src={person.image} alt="" /> : <Icon size={Math.round(size * .56)} strokeWidth={1.65} />}
  </span>;
}
export function RoomAvatar({ room }) {
  if (room.avatar === 'brand') return <span className="room-brand"><Shrimp /></span>;
  return <Avatar person={people.find(p => p.id === room.avatar) || { avatar: 'coffee', color: 'sand' }} size={40} />;
}
export function Poster({ large = false }) {
  return <div className={`brand-poster ${large ? 'large' : ''}`} role="img" aria-label="虾扯蛋品牌海报：有事说事，没事虾扯蛋。">
    <div className="poster-top"><span>虾扯蛋</span><span>OFFLINE, TOGETHER.</span></div>
    <div className="poster-main"><span>有事说事，<br />没事<span className="poster-outline">虾扯蛋。</span></span><Shrimp /></div>
    <div className="poster-bottom"><span>在同一个局域网里，扯点有的没的。</span><ArrowUpRight size={15} /></div>
  </div>;
}
export function Message({ message, privateMode, me, onPreview, room }) {
  const [revealed, setRevealed] = useState(false);
  const bubble = useRef(null);
  const dimensions = useRef(null);
  const mine = message.person === 'me';
  const person = mine ? me : people.find(p => p.id === message.person) || people[1];
  const hidden = privateMode && !revealed;
  useEffect(() => {
    const hide = () => setRevealed(false);
    hide();
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('blur', hide); document.removeEventListener('visibilitychange', hide); };
  }, [privateMode]);
  const reveal = () => {
    if (!privateMode) return;
    dimensions.current = bubble.current?.getBoundingClientRect();
    setRevealed(true);
  };
  return <article className={`message ${mine ? 'mine' : ''}`} data-message-id={message.id}>
    <Avatar person={person} size={34} />
    <div className="message-content">
      <div className="message-meta"><span>{mine ? '我' : person.name}</span><time>{message.time}</time></div>
      <div ref={bubble} className={`bubble ${hidden ? 'masked' : ''} ${!hidden && message.kind ? 'with-media' : ''}`}
        tabIndex={privateMode ? 0 : undefined} onPointerEnter={reveal} onPointerMove={() => { if (!revealed) reveal(); }} onPointerLeave={() => setRevealed(false)} onBlur={() => setRevealed(false)}
        onKeyDown={event => { if (privateMode && event.code === 'Space') { event.preventDefault(); reveal(); } }}
        onKeyUp={event => { if (event.code === 'Space') setRevealed(false); }}
        style={privateMode && revealed && dimensions.current ? { minWidth: dimensions.current.width, minHeight: dimensions.current.height } : undefined}
        aria-label={hidden ? '消息已隐藏，悬停或按住空格查看' : undefined}>
        {hidden ? <div className="masked-inner"><strong>****</strong><span><EyeOff size={13} />悬停查看</span></div> : <>
          {message.text && <p className="message-text">{message.text}</p>}
          {message.kind === 'poster' && <button className="poster-button" onClick={() => onPreview('poster')} aria-label="查看海报大图"><Poster /></button>}
          {message.kind === 'image' && <button className="uploaded-image" onClick={() => onPreview({ url: message.url, name: message.name })} aria-label="查看图片大图"><img src={message.url} alt={message.name} /></button>}
          {message.kind === 'video' && <video className="message-video" src={message.url} controls preload="metadata" />}
        </>}
      </div>
      {mine && <span className={`sent-state ${message.readCount ? 'is-read' : 'is-unread'}`} title="设计预览中的示例已读状态">{message.readCount ? <Check size={12} /> : null}{message.readCount ? room.type === 'direct' ? '已读' : `${message.readCount}/${(room.count || 2) - 1} 人已读` : '未读'}</span>}
    </div>
  </article>;
}
export function Modal({ title, subtitle, children, onClose, className = '' }) {
  const dialog = useRef(null);
  useEffect(() => { if (!dialog.current.open) dialog.current.showModal(); }, []);
  return <dialog ref={dialog} className={`modal ${className}`} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <div className="modal-shell"><header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton label="关闭" onClick={onClose}><X size={18} /></IconButton></header>{children}</div>
  </dialog>;
}
