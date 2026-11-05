<!-- 第 22 页：一次调用长什么样 -->
<template>
  <section class="slide story-slide api-call-slide">
<h1>一次调用长什么样</h1>
<div class="eyebrow">上手 ① · 服务端发送请求 → 检查响应 → 按字段读取结果</div>
<div class="story-body">
<div class="cols c21 api-example api-call">
<div class="card cy">
<div class="tag">请求示例</div>
<div class="code-wrapper"><pre v-pre class="code shiki vitesse-dark" style="background-color:#121212;color:#dbd7caee" tabindex="0"><code><span class="line"><span style="color:#CB7676">const </span><span style="color:#BD976A">response</span><span style="color:#666666"> =</span><span style="color:#4D9375"> await</span><span style="color:#80A665"> fetch</span><span style="color:#666666">(</span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">https://api.typesafe.ai/v1/systemone</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span><span style="color:#666666"> {</span></span>
<span class="line"><span style="color:#B8A965">  method</span><span style="color:#666666">: </span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">POST</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A965">  headers</span><span style="color:#666666">: {</span></span>
<span class="line"><span style="color:#B8A965">    Authorization</span><span style="color:#666666">: </span><span style="color:#C98A7D77">`</span><span style="color:#C98A7D">Bearer </span><span style="color:#4D9375">${</span><span style="color:#C98A7D">process</span><span style="color:#666666">.</span><span style="color:#C98A7D">env</span><span style="color:#666666">.</span><span style="color:#C98A7D">TYPESAFE_API_KEY</span><span style="color:#4D9375">}</span><span style="color:#C98A7D77">`</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#C98A7D77">    '</span><span style="color:#C98A7D">Content-Type</span><span style="color:#C98A7D77">'</span><span style="color:#666666">: </span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">application/json</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#666666">  },</span></span>
<span class="line"><span style="color:#B8A965">  body</span><span style="color:#666666">: </span><span style="color:#BD976A">JSON</span><span style="color:#666666">.</span><span style="color:#80A665">stringify</span><span style="color:#666666">({</span></span>
<span class="line"><span style="color:#B8A965">    model</span><span style="color:#666666">: </span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">jev-latest</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A965">    state</span><span style="color:#666666">: </span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">充值扣款了，但道具一直没到账。</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A965">    questions</span><span style="color:#666666">: {</span></span>
<span class="line"><span style="color:#B8A965">      department</span><span style="color:#666666">: {</span></span>
<span class="line"><span style="color:#B8A965">        type</span><span style="color:#666666">: </span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">choice</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A965">        instructions</span><span style="color:#666666">: </span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">这条工单的首接团队是谁？</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A965">        criteria</span><span style="color:#666666">: {</span></span>
<span class="line"><span style="color:#B8A965">          billing</span><span style="color:#666666">: </span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">支付、扣款、到账、退款问题</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A965">          technical</span><span style="color:#666666">: </span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">与支付无关的登录或功能故障</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A965">          other</span><span style="color:#666666">: </span><span style="color:#C98A7D77">'</span><span style="color:#C98A7D">其他或信息不足</span><span style="color:#C98A7D77">'</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#666666">        },</span></span>
<span class="line"><span style="color:#666666">      },</span></span>
<span class="line"><span style="color:#666666">    },</span></span>
<span class="line"><span style="color:#666666">  }),</span></span>
<span class="line"><span style="color:#666666">})</span></span></code></pre></div>
</div>
<div class="api-response card pu"><div class="tag">响应示例</div>
<div class="code-wrapper"><pre v-pre class="code shiki vitesse-dark" style="background-color:#121212;color:#dbd7caee" tabindex="0"><code><span class="line"><span style="color:#666666">{</span></span>
<span class="line"><span style="color:#B8A96577">  "</span><span style="color:#B8A965">answers</span><span style="color:#B8A96577">"</span><span style="color:#666666">:</span><span style="color:#666666"> {</span></span>
<span class="line"><span style="color:#B8A96577">    "</span><span style="color:#B8A965">department</span><span style="color:#B8A96577">"</span><span style="color:#666666">:</span><span style="color:#666666"> {</span></span>
<span class="line"><span style="color:#B8A96577">      "</span><span style="color:#B8A965">type</span><span style="color:#B8A96577">"</span><span style="color:#666666">:</span><span style="color:#C98A7D77"> "</span><span style="color:#C98A7D">choice</span><span style="color:#C98A7D77">"</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A96577">      "</span><span style="color:#B8A965">choice</span><span style="color:#B8A96577">"</span><span style="color:#666666">:</span><span style="color:#C98A7D77"> "</span><span style="color:#C98A7D">billing</span><span style="color:#C98A7D77">"</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A96577">      "</span><span style="color:#B8A965">confidence</span><span style="color:#B8A96577">"</span><span style="color:#666666">:</span><span style="color:#4C9A91"> 0.9</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A96577">      "</span><span style="color:#B8A965">probabilities</span><span style="color:#B8A96577">"</span><span style="color:#666666">:</span><span style="color:#666666"> {</span></span>
<span class="line"><span style="color:#B8A96577">        "</span><span style="color:#B8A965">billing</span><span style="color:#B8A96577">"</span><span style="color:#666666">:</span><span style="color:#4C9A91"> 0.9</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A96577">        "</span><span style="color:#B8A965">technical</span><span style="color:#B8A96577">"</span><span style="color:#666666">:</span><span style="color:#4C9A91"> 0.06</span><span style="color:#666666">,</span></span>
<span class="line"><span style="color:#B8A96577">        "</span><span style="color:#B8A965">other</span><span style="color:#B8A96577">"</span><span style="color:#666666">:</span><span style="color:#4C9A91"> 0.04</span></span>
<span class="line"><span style="color:#666666">      }</span></span>
<span class="line"><span style="color:#666666">    }</span></span>
<span class="line"><span style="color:#666666">  }</span></span>
<span class="line"><span style="color:#666666">}</span></span></code></pre></div>
<div class="api-reading">
<div class="api-reading-title">读取判断结果</div>
<div><code>choice</code><span>选中的选项</span></div>
<div><code>probabilities</code><span>各选项的概率</span></div>
<div><code>confidence</code><span>把握度，辅助决定是否复核</span></div>
</div>
</div>
</div>
<div class="takeaway">请求定义问题，响应返回判断；后续处理由业务代码决定。</div>
</div>
  </section>
</template>
