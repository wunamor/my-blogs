# LangChain 快速入门
## 环境准备
1. `OPENAI_API_KEY` 配置，以 [阿里云百炼平台](https://bailian.console.aliyun.com/) 为例
   1. [获取 API_KEY](https://bailian.console.aliyun.com/cn-beijing?tab=model#/api-key)
   ![](images/LangChain%20调用-环境准备-OPEN_API_KEY%20配置-获取API_KEY.png)
   2. 配置环境变量（Window电脑）进入环境变量配置
      1. 键是 `OPENAI_API_KEY`，值是 获取到的 `API_KEY` 
      2. 重启IDE，（如果是通过 `FlowLauncher` 启动的，`FlowLauncher` 也要重新启动后再启动IDE）
   3. [获取 url 地址](https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-market)
      1. ![](images/LangChain%20调用-环境准备-OPEN_API_KEY%20配置-获取%20url%20地址.png)
        点击模型广场-选择全部模型-选择DeepSeek-选择API参考 
      2. 往下滑动，**找到示例代码** 即可获取到 url 地址

2. 环境依赖下载 `pip install -U langchain-openai`
## `LangChain` 调用 `LLM` 
1. 配置模型
    ```Python
    # 没有 API_KEY 是因为在之前的环境变量中就已经配置过了（链式组件1）
    model = ChatOpenAI(
        model='deepseek-v4-flash', # 模型选择
        # url 配置，还可以是另一个根据业务空间的 
        # 在这个路径下面 https://bailian.console.aliyun.com/cn-beijing?tab=model#/model-market/detail/deepseek-v4-flash?serviceSite=asia-pacific-china 
        # base_url = https://${work_id}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
        base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    )
    ``` 
2. 配置发送信息
    ```Python
    # SystemMessage 是系统消息，一般存储 环境/目的 等内容
    # HumanMessage 是用户消息，存储用户需要发送的内容
    messages = [
        SystemMessage("请把下列的英文翻译为中文"),
        HumanMessage("Hello world!")
    ]
    ``` 
3. 信息发送 & 接收结果
    ```Python
    # invoke 表示调用模型，messages 里面存储发送给模型的消息
    result = model.invoke(messages)
    print(result) # 输出包括但不限于 执行结果/执行消耗token 等
    ``` 
4. 处理结果的字符串
    ```Python
    # 设置输出解析器（链式组件2）
    parser = StrOutputParser()
    print(parser.invoke(result)) # 输出 content 内容：我喜欢你！
    ```

## `LangChain` 链式调用
> 步骤大体一致，只是中途过程中是没有执行 `invoke`，只有最后才执行

```Python
# 设置模型
model = ChatOpenAI(
    model='deepseek-v4-flash',
    base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
)

# 定义消息
messages = [
    SystemMessage("请把下列的英文翻译为中文"),
    HumanMessage("I love you!")
]

# 设置输出解析器
parser = StrOutputParser()

# 链式调用
chain = model | parser # 使用 | 来表示链接
print(chain.invoke(messages)) # 只需要执行一次 invoke 即可

```


## `LangChain` 底层逻辑
1. 为什么各个组件之间调用都是 `invoke()` 来调用？
   > 它们依赖与 `Runnable` 这个[接口](https://reference.langchain.com/python/langchain-core/runnables/base/Runnable)
   > 的，`Runnable` 里面有 `invoke()` 这个函数，所以各个组件都有 `invoke()` 这个函数 

2. 组件之间如何调用呢？
   > 它们是把上一个组件执行的结果作为下一个组件的参数传入，类型与 `Linux` 中的管道符 `|`