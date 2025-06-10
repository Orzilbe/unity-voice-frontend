"use strict";(()=>{var e={};e.id=3437,e.ids=[3437],e.modules={3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},12821:(e,t,r)=>{r.r(t),r.d(t,{patchFetch:()=>C,routeModule:()=>c,serverHooks:()=>x,workAsyncStorage:()=>d,workUnitAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{GET:()=>l});var o=r(96559),a=r(48088),n=r(37719),i=r(32190),p=r(4160),u=r(12909);async function l(e){try{let t=e.headers.get("authorization");if(!t||!t.startsWith("Bearer "))return i.NextResponse.json({message:"לא מורשה"},{status:401});let r=t.split(" ")[1];if(!(0,u.bw)(r))return i.NextResponse.json({message:"טוקן לא תקף"},{status:401});let s=`
      SELECT 
        COUNT(*) as total,
        COUNT(CompletionDate) as completed,
        ROUND(COUNT(CompletionDate) * 100.0 / COUNT(*), 1) as completion_rate
      FROM tasks
    `,o=`
      SELECT 
        COUNT(*) as total,
        COUNT(CompletionDate) as completed,
        ROUND(COUNT(CompletionDate) * 100.0 / COUNT(*), 1) as completion_rate
      FROM tests
    `,a=`
      SELECT 
        COUNT(*) as total,
        COUNT(*) as completed,
        100.0 as completion_rate
      FROM interactivesessions
    `,[n,l,c]=await Promise.all([(0,p.eW)(s,[],"Fetch tasks completion rate"),(0,p.eW)(o,[],"Fetch tests completion rate"),(0,p.eW)(a,[],"Fetch exercises completion rate")]);if(!n.success||!l.success||!c.success)return console.error("Database query failed"),i.NextResponse.json({message:"שגיאה בשאילתת מסד הנתונים"},{status:500});let d=[{name:"משימות",rate:parseFloat(n.result?.[0]?.completion_rate||"0"),color:"#10B981"},{name:"מבחנים",rate:parseFloat(l.result?.[0]?.completion_rate||"0"),color:"#3B82F6"},{name:"תרגילים",rate:parseFloat(c.result?.[0]?.completion_rate||"0"),color:"#8B5CF6"}];return i.NextResponse.json(d)}catch(e){return console.error("Error fetching completion rates:",e),i.NextResponse.json({message:"שגיאה בלתי צפויה"},{status:500})}}let c=new o.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/dashboard/completion-rates/route",pathname:"/api/dashboard/completion-rates",filename:"route",bundlePath:"app/api/dashboard/completion-rates/route"},resolvedPagePath:"C:\\Projects\\100625\\unity-voice-frontend\\src\\app\\api\\dashboard\\completion-rates\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:d,workUnitAsyncStorage:m,serverHooks:x}=c;function C(){return(0,n.patchFetch)({workAsyncStorage:d,workUnitAsyncStorage:m})}},19771:e=>{e.exports=require("process")},27910:e=>{e.exports=require("stream")},28354:e=>{e.exports=require("util")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},34631:e=>{e.exports=require("tls")},41204:e=>{e.exports=require("string_decoder")},44870:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:e=>{e.exports=require("crypto")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:e=>{e.exports=require("timers")},74075:e=>{e.exports=require("zlib")},79428:e=>{e.exports=require("buffer")},79551:e=>{e.exports=require("url")},91645:e=>{e.exports=require("net")},94735:e=>{e.exports=require("events")}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[7719,580,3205,6101,1208],()=>r(12821));module.exports=s})();