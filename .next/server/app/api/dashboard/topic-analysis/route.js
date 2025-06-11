"use strict";(()=>{var e={};e.id=8061,e.ids=[8061],e.modules={3295:e=>{e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19771:e=>{e.exports=require("process")},27910:e=>{e.exports=require("stream")},28354:e=>{e.exports=require("util")},29294:e=>{e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},34631:e=>{e.exports=require("tls")},41204:e=>{e.exports=require("string_decoder")},44870:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:e=>{e.exports=require("crypto")},63033:e=>{e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:e=>{e.exports=require("timers")},74075:e=>{e.exports=require("zlib")},79428:e=>{e.exports=require("buffer")},79551:e=>{e.exports=require("url")},91645:e=>{e.exports=require("net")},94735:e=>{e.exports=require("events")},99913:(e,s,t)=>{t.r(s),t.d(s,{patchFetch:()=>N,routeModule:()=>d,serverHooks:()=>k,workAsyncStorage:()=>l,workUnitAsyncStorage:()=>T});var r={};t.r(r),t.d(r,{GET:()=>u});var a=t(96559),o=t(48088),i=t(37719),p=t(32190),n=t(4160),c=t(12909);async function u(e){try{let s=e.headers.get("authorization");if(!s||!s.startsWith("Bearer "))return p.NextResponse.json({message:"לא מורשה"},{status:401});let t=s.split(" ")[1];if(!(0,c.bw)(t))return p.NextResponse.json({message:"טוקן לא תקף"},{status:401});let r=`
      SELECT 
        u.EnglishLevel,
        t.TopicName,
        t.TopicHe,
        COUNT(task.TaskId) as task_count,
        AVG(task.TaskScore) as avg_score,
        COUNT(task.CompletionDate) as completions
      FROM users u
      JOIN tasks task ON u.UserId = task.UserId
      JOIN topics t ON task.TopicName = t.TopicName
      WHERE u.IsActive = 1 AND task.CompletionDate IS NOT NULL
      GROUP BY u.EnglishLevel, t.TopicName, t.TopicHe
      ORDER BY u.EnglishLevel, completions DESC
    `,a=`
      SELECT 
        t.TopicName,
        t.TopicHe,
        COUNT(task.TaskId) as total_tasks,
        COUNT(task.CompletionDate) as completed_tasks,
        ROUND(AVG(task.TaskScore), 1) as avg_score,
        COUNT(DISTINCT task.UserId) as unique_users
      FROM topics t
      JOIN tasks task ON t.TopicName = task.TopicName
      WHERE task.StartDate > DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY t.TopicName, t.TopicHe
      ORDER BY completed_tasks DESC
      LIMIT 10
    `,o=`
      SELECT 
        t.TopicName,
        t.TopicHe,
        AVG(task.DurationTask) as avg_duration_minutes,
        AVG(task.TaskScore) as avg_score,
        COUNT(DISTINCT word.WordId) as unique_words,
        ROUND(AVG(task.TaskScore) / (AVG(task.DurationTask) / 60), 2) as efficiency_score
      FROM topics t
      JOIN tasks task ON t.TopicName = task.TopicName
      LEFT JOIN wordintask wt ON task.TaskId = wt.TaskId
      LEFT JOIN words word ON wt.WordId = word.WordId
      WHERE task.CompletionDate IS NOT NULL 
        AND task.DurationTask > 0
        AND task.CompletionDate > DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY t.TopicName, t.TopicHe
      ORDER BY efficiency_score DESC
    `,[i,u,d]=await Promise.all([(0,n.eW)(r,[],"Fetch topics by level"),(0,n.eW)(a,[],"Fetch popular topics"),(0,n.eW)(o,[],"Fetch learning efficiency")]);if(!i.success||!u.success||!d.success)return console.error("Database query failed"),p.NextResponse.json({message:"שגיאה בשאילתת מסד הנתונים"},{status:500});let l={topicsByLevel:i.result,popularTopics:u.result,learningEfficiency:d.result};return p.NextResponse.json(l)}catch(e){return console.error("Error fetching topic analysis:",e),p.NextResponse.json({message:"שגיאה בלתי צפויה"},{status:500})}}let d=new a.AppRouteRouteModule({definition:{kind:o.RouteKind.APP_ROUTE,page:"/api/dashboard/topic-analysis/route",pathname:"/api/dashboard/topic-analysis",filename:"route",bundlePath:"app/api/dashboard/topic-analysis/route"},resolvedPagePath:"C:\\Projects\\110625\\unity-voice-frontend\\src\\app\\api\\dashboard\\topic-analysis\\route.ts",nextConfigOutput:"",userland:r}),{workAsyncStorage:l,workUnitAsyncStorage:T,serverHooks:k}=d;function N(){return(0,i.patchFetch)({workAsyncStorage:l,workUnitAsyncStorage:T})}}};var s=require("../../../../webpack-runtime.js");s.C(e);var t=e=>s(s.s=e),r=s.X(0,[7719,580,3205,6101,1208],()=>t(99913));module.exports=r})();