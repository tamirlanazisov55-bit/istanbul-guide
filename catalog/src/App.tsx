import {useEffect, useMemo, useRef, useState} from 'react';
import {Button} from './toolcraft/components/primitives/button';
import {Input} from './toolcraft/components/primitives/input';
import sourcePlaces from './places.json';

type Place = typeof sourcePlaces[number];
const places:Place[]=sourcePlaces;
const categories=[
 {name:'Еда', caption:'Кебаб, дёнер и турецкая кухня'},
 {name:'Кофе и матча', caption:'Кофейни и матча-бары'},
 {name:'Завтраки', caption:'Утренние остановки'},
 {name:'Выпечка и десерты', caption:'Пекарни и сладкое'},
 {name:'Прогулки и виды', caption:'Районы, смотровые точки и пляжи'},
 {name:'Книги и культура', caption:'Книги, искусство и фотобудка'},
 {name:'Магазины', caption:'Одежда, парфюмерия и подарки'},
 {name:'Бары', caption:'Вечерняя остановка'},
 {name:'Отели', caption:'Места для проживания'},
];
const STORE='istanbul-places-saved-v1';
const norm=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ё/g,'е');
const sortPlaces=(a:Place,b:Place)=>a.name.localeCompare(b.name,'ru',{sensitivity:'base',numeric:true});
function getInitialSaved(){try{const v=JSON.parse(localStorage.getItem(STORE)||'[]'); return new Set<string>(Array.isArray(v)?v.filter(x=>typeof x==='string'&&places.some(p=>p.id===x)):[]);}catch{return new Set<string>();}}
function plural(n:number){return n%10===1&&n%100!==11?'место':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'места':'мест';}

export default function App(){
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('Все места');
 const [savedOnly,setSavedOnly]=useState(false);
 const [saved,setSaved]=useState(getInitialSaved);
 const [limit,setLimit]=useState(24);
 const [sort,setSort]=useState('category');
 const [mobileFilters,setMobileFilters]=useState(false);
 const [toast,setToast]=useState('');
 const [storageUnavailable,setStorageUnavailable]=useState(false);
 const searchRef=useRef<HTMLInputElement>(null);
 const toastTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const listRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{try{localStorage.setItem(STORE,JSON.stringify([...saved]));setStorageUnavailable(false);}catch{setStorageUnavailable(true);}},[saved]);
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchRef.current?.focus();}if(e.key==='Escape'){setMobileFilters(false);}};window.addEventListener('keydown',fn);return()=>{window.removeEventListener('keydown',fn);clearTimeout(toastTimer.current);}},[]);
 const q=norm(query.trim());
 const searchMatched=useMemo(()=>places.filter(p=>(!savedOnly||saved.has(p.id))&&(!q||(norm(p.name+' '+p.description).includes(q)||norm(p.category)===q))),[q,savedOnly,saved]);
 const result=useMemo(()=>searchMatched.filter(p=>category==='Все места'||p.category===category).sort((a,b)=>sort==='az'?sortPlaces(a,b):categories.findIndex(c=>c.name===a.category)-categories.findIndex(c=>c.name===b.category)||Number(a.needsLocation)-Number(b.needsLocation)||sortPlaces(a,b)),[searchMatched,category,sort]);
 const visible=result.slice(0,limit);
 function announce(s:string){setToast(s);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),2700);}
 function toggleSaved(p:Place){setSaved(prev=>{const next=new Set(prev);next.has(p.id)?next.delete(p.id):next.add(p.id);return next;});announce(saved.has(p.id)?'Место удалено из сохранённых':'Место сохранено');}
 function chooseCategory(c:string){setCategory(c);setLimit(24);setMobileFilters(false);}
 function reset(){setQuery('');setCategory('Все места');setSavedOnly(false);setLimit(24);}
 const activeFilters=!!query||category!=='Все места'||savedOnly;
 const countFor=(c:string)=>c==='Все места'?searchMatched.length:searchMatched.filter(p=>p.category===c).length;
 function filterNav(){return <nav aria-label="Категории мест" className="category-nav"><Button variant="ghost" size="xl" className={'category-button '+(category==='Все места'?'is-current':'')} aria-pressed={category==='Все места'} onClick={()=>chooseCategory('Все места')}><span className="category-number">00</span><span>Все места</span><span className="count">{countFor('Все места')}</span></Button>{categories.map(({name},i)=><Button key={name} variant="ghost" size="xl" className={'category-button '+(category===name?'is-current':'')} aria-pressed={category===name} onClick={()=>chooseCategory(name)}><span className="category-number">{String(i+1).padStart(2,'0')}</span><span>{name}</span><span className="count">{countFor(name)}</span></Button>)}</nav>;}
 return <>
  <a className="skip-link" href="#catalog">Перейти к местам</a>
  <header className="site-header"><a href="#" className="brand" aria-label="Азисов Тамирлан — начало">Азисов Тамирлан</a><div className="city-label">Стамбул <span>/ 72 места</span></div><Button variant="outline" size="xl" className={'saved-top '+(savedOnly?'selected':'')} aria-label={'Сохранённые '+saved.size} aria-pressed={savedOnly} onClick={()=>{setSavedOnly(!savedOnly);setLimit(24);setCategory('Все места');}}><span>Сохранённые</span><span className="saved-counter">{saved.size}</span></Button></header>
  <main>
   <section className="workspace" id="catalog" aria-label="Каталог мест">
    <aside className="sidebar"><div className="sidebar-title">Категории</div>{filterNav()}<div className="sidebar-note"><p>Соберите свою подборку.<br/><span>{storageUnavailable?'В этом браузере сохранения доступны только до закрытия страницы.':'Сохранённые места останутся в этом браузере.'}</span></p></div></aside>
    <div className="catalog-content" ref={listRef}>
     <div className="catalog-toolbar"><div className="search-wrap"><Input ref={searchRef} size="xl" value={query} onChange={e=>{setQuery(e.target.value);setLimit(24);}} placeholder="Название, кухня или занятие" aria-label="Поиск мест" className="search-input"/>{query?<Button variant="ghost" size="xl" className="search-clear" aria-label="Очистить поиск" onClick={()=>{setQuery('');setLimit(24);searchRef.current?.focus();}}>Очистить</Button>:<kbd>⌘ K</kbd>}</div><label className="sort-control"><span className="sr-only">Сортировка</span><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Сортировка"><option value="category">По категориям</option><option value="az">По названию</option></select></label><Button variant="outline" size="xl" className="mobile-filter" aria-expanded={mobileFilters} onClick={()=>setMobileFilters(!mobileFilters)}>Категории</Button></div>
     {mobileFilters&&<div className="mobile-filter-panel"><div className="mobile-filter-title">Категории<Button variant="ghost" size="xl" aria-label="Закрыть категории" onClick={()=>setMobileFilters(false)}>Закрыть</Button></div>{filterNav()}</div>}
     <div className="results-header"><div><h1>{savedOnly?'Сохранённые':category==='Все места'?'Каталог мест':category}</h1><span className="result-count" aria-live="polite" aria-atomic="true">{result.length} {plural(result.length)}</span></div>{activeFilters?<Button variant="ghost" size="lg" className="reset-button" onClick={reset}>Сбросить</Button>:<span className="results-caption">Стамбул / каталог</span>}</div>
     {savedOnly&&<p className="saved-explainer">Ваша подборка на этом устройстве. Нажмите «Убрать», чтобы удалить место из подборки.</p>}
     {result.length>0?<><div className="place-grid">{visible.map(p=><article className="place-card" key={p.id} id={p.id} data-testid="place-card"><div className="card-top"><span className="category-tag" data-category={p.category}><span className="place-number">{p.id.slice(1)}</span>{p.category}</span><Button variant="ghost" size="xl" className={'bookmark-button '+(saved.has(p.id)?'bookmarked':'')} aria-label={(saved.has(p.id)?'Убрать из сохранённых: ':'Сохранить: ')+p.name} aria-pressed={saved.has(p.id)} title={saved.has(p.id)?'Убрать из сохранённых':'Сохранить место'} onClick={()=>toggleSaved(p)}>{saved.has(p.id)?'Убрать':'Сохранить'}</Button></div><div className="card-copy"><h3>{p.name}</h3><p>{p.description}</p>{p.needsLocation&&<span className="location-pending">Расположение не уточнено</span>}</div><div className="card-actions"><a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-link" aria-label={(p.needsLocation?'Искать в Google Картах: ':'Открыть в Google Картах: ')+p.name}>{p.needsLocation?'Поиск в Картах':'Google Карты'}</a>{p.routeUrl?<a href={p.routeUrl} target="_blank" rel="noopener noreferrer" className="route-link" aria-label={'Построить маршрут: '+p.name}>Маршрут</a>:<span className="route-unavailable" title="Для маршрута нужен точный адрес">Нужен адрес</span>}</div></article>)}</div>{limit<result.length&&<div className="load-more"><p>Показано {visible.length} из {result.length}</p><Button size="xl" className="more-button" onClick={()=>setLimit(l=>l+24)}>Показать ещё {Math.min(24,result.length-limit)}</Button></div>}<div className="catalog-bottom"><span>Показано {visible.length} из {result.length}</span><a href="#catalog">К поиску</a></div></>:<div className="empty-state"><h3>{savedOnly&&!saved.size?'Пока без закладок':'Места не найдены'}</h3><p>{savedOnly&&!saved.size?'Нажимайте «Сохранить» на карточках мест. Здесь появится ваша подборка.':'Попробуйте другое название или сбросьте фильтры.'}</p><Button size="xl" className="more-button" onClick={reset}>{savedOnly&&!saved.size?'Посмотреть все места':'Сбросить фильтры'}</Button></div>}
    </div>
   </section>
   <section className="visit-note"><h2>Перед визитом</h2><p>Проверьте часы работы и адрес в Google Картах. У заведений с несколькими филиалами выберите нужный перед построением маршрута.</p><p>Для четырёх отметок точный адрес ещё не уточнён. На их карточках доступен поиск в Картах.</p></section>
  </main>
  <footer className="tile-footer" aria-label="Декоративный орнамент из изникских плиток">
   {Array.from({length:32},(_,i)=><div key={i} className="footer-tile" style={{backgroundPosition:`${(i%4)*100/3}% ${Math.floor(i/4)%6*20}%`}} aria-hidden="true"/>)}
  </footer>
  <div className={'toast '+(toast?'show':'')} role="status" aria-live="polite">{toast}</div>
 </>;
}
