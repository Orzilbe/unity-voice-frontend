"use strict";(()=>{var e={};e.id=1185,e.ids=[1185],e.modules={3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19771:e=>{e.exports=require("process")},27910:e=>{e.exports=require("stream")},28354:e=>{e.exports=require("util")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},32898:(e,t,r)=>{r.r(t),r.d(t,{patchFetch:()=>N,routeModule:()=>p,serverHooks:()=>T,workAsyncStorage:()=>d,workUnitAsyncStorage:()=>A});var s={};r.r(s),r.d(s,{GET:()=>E});var a=r(96559),o=r(48088),i=r(37719),n=r(32190),u=r(4160),c=r(12909);async function E(e){try{let t=e.headers.get("authorization");if(!t||!t.startsWith("Bearer "))return n.NextResponse.json({message:"לא מורשה"},{status:401});let r=t.split(" ")[1];if(!(0,c.bw)(r))return n.NextResponse.json({message:"טוקן לא תקף"},{status:401});let s=`
      SELECT 
        COUNT(DISTINCT CASE WHEN LastLogin > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN UserId END) as current_active,
        COUNT(DISTINCT CASE WHEN LastLogin BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
          AND DATE_SUB(NOW(), INTERVAL 30 DAY) THEN UserId END) as previous_active
      FROM users
      WHERE IsActive = 1
    `,a=`
      SELECT 
        (SELECT AVG(TaskScore) FROM tasks WHERE CompletionDate > DATE_SUB(NOW(), INTERVAL 7 DAY)) as current_score,
        (SELECT AVG(TaskScore) FROM tasks WHERE CompletionDate BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) 
          AND DATE_SUB(NOW(), INTERVAL 7 DAY)) as previous_score
    `,o=`
      SELECT 
        COUNT(CASE WHEN CreationDate > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as current_month,
        COUNT(CASE WHEN CreationDate BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) 
          AND DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as previous_month
      FROM users
      WHERE IsActive = 1
    `,i=`
      SELECT 
        DAYNAME(CompletionDate) as day_name,
        COUNT(*) as activities,
        AVG(TaskScore) as avg_score
      FROM tasks
      WHERE CompletionDate > DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DAYNAME(CompletionDate), WEEKDAY(CompletionDate)
      ORDER BY WEEKDAY(CompletionDate)
    `,E=`
      SELECT 
        DATE(CompletionDate) as activity_date,
        COUNT(*) as daily_activities,
        COUNT(DISTINCT UserId) as unique_users
      FROM tasks
      WHERE CompletionDate > DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(CompletionDate)
      ORDER BY activity_date
    `,[p,d,A,T,N]=await Promise.all([(0,u.eW)(s,[],"Fetch user activity change"),(0,u.eW)(a,[],"Fetch score change"),(0,u.eW)(o,[],"Fetch user growth"),(0,u.eW)(i,[],"Fetch weekly activity"),(0,u.eW)(E,[],"Fetch trend forecast")]);if(!p.success||!d.success||!A.success||!T.success||!N.success)return console.error("Database query failed"),n.NextResponse.json({message:"שגיאה בשאילתת מסד הנתונים"},{status:500});let D=p.result?.[0],l=D?.previous_active&&D?.current_active?((D.current_active-D.previous_active)/D.previous_active*100).toFixed(1):"0",v=d.result?.[0],_=v?.previous_score&&v?.current_score?((v.current_score-v.previous_score)/v.previous_score*100).toFixed(1):"0",m=A.result?.[0],C=m?.previous_month&&m?.current_month?((m.current_month-m.previous_month)/m.previous_month*100).toFixed(1):"0",R={activityChange:parseFloat(l),scoreChange:parseFloat(_),userGrowth:parseFloat(C),weeklyActivity:(T.result||[]).map(e=>({...e,day_name:"Sunday"===e.day_name?"ראשון":"Monday"===e.day_name?"שני":"Tuesday"===e.day_name?"שלישי":"Wednesday"===e.day_name?"רביעי":"Thursday"===e.day_name?"חמישי":"Friday"===e.day_name?"שישי":"שבת"})),trendForecast:N.result||[]};return n.NextResponse.json(R)}catch(e){return console.error("Error fetching advanced stats:",e),n.NextResponse.json({message:"שגיאה בלתי צפויה"},{status:500})}}let p=new a.AppRouteRouteModule({definition:{kind:o.RouteKind.APP_ROUTE,page:"/api/dashboard/advanced-stats/route",pathname:"/api/dashboard/advanced-stats",filename:"route",bundlePath:"app/api/dashboard/advanced-stats/route"},resolvedPagePath:"C:\\Projects\\110625\\unity-voice-frontend\\src\\app\\api\\dashboard\\advanced-stats\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:d,workUnitAsyncStorage:A,serverHooks:T}=p;function N(){return(0,i.patchFetch)({workAsyncStorage:d,workUnitAsyncStorage:A})}},34631:e=>{e.exports=require("tls")},41204:e=>{e.exports=require("string_decoder")},44870:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:e=>{e.exports=require("crypto")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:e=>{e.exports=require("timers")},74075:e=>{e.exports=require("zlib")},79428:e=>{e.exports=require("buffer")},79551:e=>{e.exports=require("url")},91645:e=>{e.exports=require("net")},94735:e=>{e.exports=require("events")}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[7719,580,3205,6101,1208],()=>r(32898));module.exports=s})();