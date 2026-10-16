'use client';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import type {Unit} from '../lib/catalog';
const Experience=lazy(()=>import('./architecture-experience'));
export default function DeferredArchitecture(props:{units:Unit[];visibleIds:string[];selected:string;onSelect:(id:string)=>void;onDetails:(id:string)=>void;interiorOnly?:boolean;hero?:boolean}){const ref=useRef<HTMLDivElement>(null),[active,setActive]=useState(!!props.interiorOnly||!!props.hero);useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setActive(true);o.disconnect()}},{rootMargin:'200px'});o.observe(ref.current!);return()=>o.disconnect()},[]);const preview=<div className="architecture-preview"><span>A preparar o explorador 3D…</span></div>;return <div ref={ref}>{active?<Suspense fallback={preview}><Experience {...props}/></Suspense>:preview}</div>}
