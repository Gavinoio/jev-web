<!-- 第 12 页：一次调用：发请求、拿响应、读结果 -->
<template>
  <section class="slide story-slide api-call-slide">
<h1>一次调用：发请求、拿响应、读结果</h1>
<div class="eyebrow">动手调用 ② · 服务端代码，三步写完</div>
<div class="story-body">
<div class="ac">
  <div class="ac-box cy">
    <div class="ac-hd"><b>1</b><span>发送请求</span><small>服务端代码 · Key 从环境变量读取</small></div>
<pre v-pre><span class="k">const</span> res = <span class="k">await</span> fetch(<span class="s">'https://api.typesafe.ai/v1/systemone'</span>, {
  <span class="p">method</span>: <span class="s">'POST'</span>,
  <span class="p">headers</span>: { <span class="p">Authorization</span>: <span class="s">`Bearer ${process.env.TYPESAFE_API_KEY}`</span>,
             <span class="s">'Content-Type'</span>: <span class="s">'application/json'</span> },
  <span class="p">body</span>: JSON.stringify({
    <span class="p">model</span>: <span class="s">'jev-latest'</span>,
    <span class="p">state</span>: <span class="s">'充值扣款了，但道具一直没到账。'</span>,
    <span class="p">questions</span>: {
      <span class="p">department</span>: {
        <span class="p">type</span>: <span class="s">'choice'</span>,
        <span class="p">instructions</span>: <span class="s">'这条工单的首接团队是谁？'</span>,
        <span class="p">criteria</span>: {
          <span class="p">billing</span>: <span class="s">'支付、扣款、到账、退款问题'</span>,
          <span class="p">technical</span>: <span class="s">'与支付无关的登录或功能故障'</span>,
          <span class="p">other</span>: <span class="s">'其他或信息不足'</span> } } },
  }),
})</pre>
  </div>
  <div class="ac-side">
    <div class="ac-box pu">
      <div class="ac-hd"><b>2</b><span>拿到响应</span><small>示例数据</small></div>
<pre v-pre>{
  <span class="p">"answers"</span>: {
    <span class="p">"department"</span>: {
      <span class="p">"type"</span>: <span class="s">"choice"</span>,
      <mark><span class="p">"choice"</span>: <span class="s">"billing"</span></mark>,
      <mark><span class="p">"confidence"</span>: <span class="n">0.9</span></mark>,
      <span class="p">"probabilities"</span>: { <span class="p">"billing"</span>: <span class="n">0.9</span>, <span class="p">"technical"</span>: <span class="n">0.06</span>, … }
    }
  }
}</pre>
    </div>
    <div class="ac-box gn">
      <div class="ac-hd"><b>3</b><span>读取结果</span><small>分界线见第 18 页</small></div>
<pre v-pre><span class="k">const</span> { answers } = <span class="k">await</span> res.json()
<span class="k">const</span> { <mark>choice</mark>, <mark>confidence</mark> } = answers.department
<span class="k">if</span> (confidence &gt;= <span class="n">0.85</span>) assignTo(choice)  <span class="c">// 直接分配</span>
<span class="k">else</span> sendToHuman()                  <span class="c">// 转人工复核</span></pre>
    </div>
  </div>
</div>
<div class="takeaway">请求定义问题，响应只给判断；拿到 <code>confidence</code> 之后怎么处理，由业务代码决定。</div>
</div>
  </section>
</template>
