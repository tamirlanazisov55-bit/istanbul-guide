import {useEffect, useMemo, useRef, useState} from 'react';
import {Button} from './toolcraft/components/primitives/button';
import sourcePlaces from './places.json';
import ratingData from './ratings.json';
import collectionCsv from './collection.csv?raw';
const collectionDownload='data:text/csv;charset=utf-8,'+encodeURIComponent('\uFEFF'+collectionCsv);

type Place = typeof sourcePlaces[number];
const places:Place[]=sourcePlaces;
const ratings:Record<string,{score:number|null;status:string;sourceUrl:string;checkedAt:string;address:string}>=ratingData;
function PlaceRating({place}:{place:Place}){const r=ratings[place.id];return r?.score?<a className="place-rating" href={r.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Рейтинг Google Карт: ${r.score.toFixed(1).replace('.',',')} из 5 — ${place.name}`} title={`Google Карты · Проверено 9 ноября 2026 · ${r.address}`}><span>{r.score.toFixed(1).replace('.',',')}</span><span className="rating-scale"> / 5</span></a>:r?.status==='unrated'?<span className="rating-unavailable" title="У этой точки нет собственной оценки в Google Картах">Без рейтинга</span>:<a className="rating-unavailable" href={place.mapsUrl} target="_blank" rel="noopener noreferrer" title="Нужно уточнить заведение или филиал">Проверить рейтинг</a>;}
const categories=[
 {name:'Еда', caption:'Кебаб, дёнер и турецкая кухня'},
 {name:'Кофе и матча', caption:'Кофейни и матча-бары'},
 {name:'Завтраки', caption:'Утренние остановки'},
 {name:'Выпечка и десерты', caption:'Пекарни и сладкое'},
 {name:'Прогулки и виды', caption:'Районы, смотровые точки и пляжи'},
 {name:'Книги и культура', caption:'Книги, искусство и фотобудка'},
 {name:'Магазины', caption:'Одежда, парфюмерия и подарки'},
 {name:'Отели', caption:'Места для проживания'},
];
const STORE='istanbul-places-saved-v1';
const sortPlaces=(a:Place,b:Place)=>a.name.localeCompare(b.name,'ru',{sensitivity:'base',numeric:true});
function getInitialSaved(){try{const v=JSON.parse(localStorage.getItem(STORE)||'[]'); return new Set<string>(Array.isArray(v)?v.filter(x=>typeof x==='string'&&places.some(p=>p.id===x)):[]);}catch{return new Set<string>();}}
function plural(n:number){return n%10===1&&n%100!==11?'место':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'места':'мест';}

export default function App(){
 const [category,setCategory]=useState('Все места');
 const [savedOnly,setSavedOnly]=useState(false);
 const [saved,setSaved]=useState(getInitialSaved);
 const [limit,setLimit]=useState(24);
 const [mobileFilters,setMobileFilters]=useState(false);
 const [toast,setToast]=useState('');
 const [storageUnavailable,setStorageUnavailable]=useState(false);
 const collectionDialog=useRef<HTMLDialogElement>(null);
 const toastTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>{try{localStorage.setItem(STORE,JSON.stringify([...saved]));setStorageUnavailable(false);}catch{setStorageUnavailable(true);}},[saved]);
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(e.key==='Escape')setMobileFilters(false);};window.addEventListener('keydown',fn);return()=>{window.removeEventListener('keydown',fn);clearTimeout(toastTimer.current);}},[]);
 const available=useMemo(()=>places.filter(p=>!savedOnly||saved.has(p.id)),[savedOnly,saved]);
 const result=useMemo(()=>available.filter(p=>category==='Все места'||p.category===category).sort((a,b)=>categories.findIndex(c=>c.name===a.category)-categories.findIndex(c=>c.name===b.category)||Number(a.needsLocation)-Number(b.needsLocation)||sortPlaces(a,b)),[available,category]);
 const visible=result.slice(0,limit);
 function announce(s:string){setToast(s);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),2700);}
 function toggleSaved(p:Place){setSaved(prev=>{const next=new Set(prev);next.has(p.id)?next.delete(p.id):next.add(p.id);return next;});announce(saved.has(p.id)?'Место удалено из сохранённых':'Место сохранено');}
 function saveCollection(){setSaved(new Set(places.map(p=>p.id)));collectionDialog.current?.close();announce('Вся подборка добавлена в сохранённые на этом устройстве');}
 function chooseCategory(c:string){setCategory(c);setLimit(24);setMobileFilters(false);}
 function reset(){setCategory('Все места');setSavedOnly(false);setLimit(24);}
 const activeFilters=category!=='Все места'||savedOnly;
 const countFor=(c:string)=>c==='Все места'?available.length:available.filter(p=>p.category===c).length;
 function filterNav(){return <nav aria-label="Категории мест" className="category-nav"><Button variant="ghost" size="xl" className={'category-button '+(category==='Все места'?'is-current':'')} aria-pressed={category==='Все места'} onClick={()=>chooseCategory('Все места')}><span>Все места</span><span className="count">{countFor('Все места')}</span></Button>{categories.map(({name})=><Button key={name} variant="ghost" size="xl" className={'category-button '+(category===name?'is-current':'')} aria-pressed={category===name} onClick={()=>chooseCategory(name)}><span>{name}</span><span className="count">{countFor(name)}</span></Button>)}</nav>;}
 return <>
  <a className="skip-link" href="#catalog">Перейти к местам</a>
  <header className="site-header"><a href="#" className="brand" aria-label="Азисов Тамирлан — начало">Азисов Тамирлан</a><div className="city-label">Стамбул <span>/ {places.length} {plural(places.length)}</span></div><div className="header-actions"><Button variant="outline" size="xl" className="collection-top" onClick={()=>collectionDialog.current?.showModal()}>Сохранить подборку</Button><Button variant="outline" size="xl" className={'saved-top '+(savedOnly?'selected':'')} aria-label={'Сохранённые '+saved.size} aria-pressed={savedOnly} onClick={()=>{setSavedOnly(!savedOnly);setLimit(24);setCategory('Все места');}}><span>Сохранённые</span><span className="saved-counter">{saved.size}</span></Button></div></header>
  <dialog ref={collectionDialog} className="collection-dialog" aria-labelledby="collection-title" aria-describedby="collection-description" onClick={e=>{if(e.target===e.currentTarget)collectionDialog.current?.close();}}>
   <div className="collection-dialog-body">
    <div className="collection-dialog-heading"><span>Стамбул / {places.length} {plural(places.length)}</span><Button variant="ghost" className="dialog-close" aria-label="Закрыть сохранение подборки" onClick={()=>collectionDialog.current?.close()}>Закрыть</Button></div>
    <h2 id="collection-title">Сохранить подборку</h2>
    <p id="collection-description">{places.length} {plural(places.length)} с категориями, описаниями и ссылками на Google Карты.</p>
    <section className="collection-option"><h3>На этом устройстве</h3><p>Добавьте всю подборку в раздел «Сохранённые». Она останется в этом браузере.</p><Button className="collection-primary" onClick={saveCollection}>Сохранить {places.length} {plural(places.length)}</Button>{storageUnavailable&&<p role="status">Хранилище браузера недоступно. Скачайте CSV, чтобы сохранить подборку.</p>}</section>
    <section className="collection-option"><h3>В Google My Maps</h3><p>Скачайте файл и импортируйте его в свою карту на компьютере.</p><div className="collection-export-actions"><a href={collectionDownload} download={`istanbul-${places.length}-places.csv`}>Скачать CSV</a><a href="https://www.google.com/maps/d/" target="_blank" rel="noopener noreferrer">Открыть My Maps</a></div><details><summary>Как добавить места на карту</summary><ol><li>В My Maps создайте карту и нажмите «Импорт».</li><li>Загрузите CSV. Для расположения выберите «Место для поиска», для названий — «Название».</li><li>Проверьте найденные адреса и филиалы. У четырёх мест расположение требует уточнения.</li></ol><p>Это отдельная карта My Maps. Импорт не добавляет места в обычные списки Google Карт.</p><a href="https://support.google.com/mymaps/answer/3024836?hl=ru" target="_blank" rel="noopener noreferrer">Инструкция Google</a></details></section>
   </div>
  </dialog>
  <main>
   <section className="workspace" id="catalog" aria-label="Каталог мест">
    <aside className="sidebar"><div className="sidebar-title">Категории</div>{filterNav()}</aside>
    <div className="catalog-content">
     <Button variant="outline" size="xl" className="mobile-filter" aria-expanded={mobileFilters} onClick={()=>setMobileFilters(!mobileFilters)}>Категории</Button>
     {mobileFilters&&<div className="mobile-filter-panel"><div className="mobile-filter-title">Категории<Button variant="ghost" size="xl" aria-label="Закрыть категории" onClick={()=>setMobileFilters(false)}>Закрыть</Button></div>{filterNav()}</div>}
     <div className="results-header"><div><h1>{savedOnly?'Сохранённые':category==='Все места'?'Каталог мест':category}</h1><span className="result-count" aria-live="polite" aria-atomic="true">{result.length} {plural(result.length)}</span></div>{activeFilters?<Button variant="ghost" size="lg" className="reset-button" onClick={reset}>Сбросить</Button>:null}</div>
     {savedOnly&&<p className="saved-explainer">Ваша подборка на этом устройстве. Нажмите «Убрать», чтобы удалить место из подборки.</p>}
     {result.length>0?<><div className="place-grid">{visible.map(p=><article className="place-card" key={p.id} id={p.id} data-testid="place-card"><div className="card-top"><span className="category-tag" data-category={p.category}>{p.category}</span><PlaceRating place={p}/></div><div className="card-copy"><h3>{p.name}</h3><p>{p.description}</p>{p.needsLocation&&<span className="location-pending">Расположение не уточнено</span>}</div><div className="card-actions"><a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-link" aria-label={(p.needsLocation?'Искать в Google Картах: ':'Открыть в Google Картах: ')+p.name}>{p.needsLocation?'Поиск в Картах':'Google Карты'}</a><Button variant="ghost" size="xl" className={'bookmark-button '+(saved.has(p.id)?'bookmarked':'')} aria-label={(saved.has(p.id)?'Убрать из сохранённых: ':'Сохранить: ')+p.name} aria-pressed={saved.has(p.id)} title={saved.has(p.id)?'Убрать из сохранённых':'Сохранить место'} onClick={()=>toggleSaved(p)}>{saved.has(p.id)?'Убрать':'Сохранить'}</Button></div></article>)}</div>{limit<result.length&&<div className="load-more"><p>Показано {visible.length} из {result.length}</p><Button size="xl" className="more-button" onClick={()=>setLimit(l=>l+24)}>Показать ещё {Math.min(24,result.length-limit)}</Button></div>}</>:<div className="empty-state"><h3>{savedOnly&&!saved.size?'Пока без закладок':'Места не найдены'}</h3><p>{savedOnly&&!saved.size?'Нажимайте «Сохранить» на карточках мест. Здесь появится ваша подборка.':'Выберите другую категорию или сбросьте фильтры.'}</p><Button size="xl" className="more-button" onClick={reset}>{savedOnly&&!saved.size?'Посмотреть все места':'Сбросить фильтры'}</Button></div>}
    </div>
   </section>
  </main>
  <footer className="tile-footer" aria-label="Декоративный орнамент из изникских плиток">
   {Array.from({length:32},(_,i)=><div key={i} className="footer-tile" style={{backgroundPosition:`${(i%4)*100/3}% ${Math.floor(i/4)%6*20}%`}} aria-hidden="true"/>)}
  </footer>
  <div className={'toast '+(toast?'show':'')} role="status" aria-live="polite">{toast}</div>
 </>;
}
