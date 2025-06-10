"use strict";(()=>{var e={};e.id=5304,e.ids=[5304],e.modules={3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19771:e=>{e.exports=require("process")},27910:e=>{e.exports=require("stream")},28354:e=>{e.exports=require("util")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},34631:e=>{e.exports=require("tls")},41204:e=>{e.exports=require("string_decoder")},44870:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:e=>{e.exports=require("crypto")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:e=>{e.exports=require("timers")},74075:e=>{e.exports=require("zlib")},79428:e=>{e.exports=require("buffer")},79551:e=>{e.exports=require("url")},91645:e=>{e.exports=require("net")},94735:e=>{e.exports=require("events")},99409:(e,r,t)=>{t.r(r),t.d(r,{patchFetch:()=>m,routeModule:()=>x,serverHooks:()=>q,workAsyncStorage:()=>d,workUnitAsyncStorage:()=>l});var s={};t.r(s),t.d(s,{GET:()=>c});var o=t(96559),u=t(48088),a=t(37719),n=t(32190),i=t(4160),p=t(12909);async function c(e){try{let r=e.headers.get("authorization");if(!r||!r.startsWith("Bearer "))return n.NextResponse.json({message:"לא מורשה"},{status:401});let t=r.split(" ")[1];if(!(0,p.bw)(t))return n.NextResponse.json({message:"טוקן לא תקף"},{status:401});let s=`
      SELECT 
        u.UserId, 
        u.FirstName, 
        u.LastName, 
        u.Score, 
        u.ProfilePicture,
        @rank := @rank + 1 AS UserRank
      FROM 
        users u, 
        (SELECT @rank := 0) r
      WHERE 
        u.IsActive = 1
      ORDER BY 
        u.Score DESC
      LIMIT 5
    `,o=await (0,i.eW)(s,[],"Fetch top users");if(!o.success)return console.error("Database query failed:",o.error),n.NextResponse.json({message:"שגיאה בשאילתת מסד הנתונים"},{status:500});return n.NextResponse.json(o.result)}catch(e){return console.error("Error fetching top users:",e),n.NextResponse.json({message:"שגיאה בלתי צפויה במהלך שליפת המשתמשים המובילים"},{status:500})}}let x=new o.AppRouteRouteModule({definition:{kind:u.RouteKind.APP_ROUTE,page:"/api/top-users/route",pathname:"/api/top-users",filename:"route",bundlePath:"app/api/top-users/route"},resolvedPagePath:"C:\\Projects\\100625\\unity-voice-frontend\\src\\app\\api\\top-users\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:d,workUnitAsyncStorage:l,serverHooks:q}=x;function m(){return(0,a.patchFetch)({workAsyncStorage:d,workUnitAsyncStorage:l})}}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[7719,580,3205,6101,1208],()=>t(99409));module.exports=s})();