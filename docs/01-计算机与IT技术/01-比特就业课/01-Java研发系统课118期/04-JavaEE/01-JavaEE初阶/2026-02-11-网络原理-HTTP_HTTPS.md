# 2026-02-11-网络原理-HTTP_HTTPS
> HTTP(S) 请求需要使用抓包工具来抓取，入门是可以使用 [Fiddler](https://www.telerik.com/download/fiddler) 来抓取

## URL
### 结构
就以 `http://www.msftconnecttest.com/connecttest.txt` 为例
- `http://`： 是表示请求协议
- `www.msftconnecttest.com`： 是表示请求地址，**如果是 http 协议请求的是 80  端口或者 https 请求的是 443 端口，这两个情况下端口是可以省略的**
- `/connecttest.txt`： 是表示**资源存储的路径**
- `#`： 是用来表示标志符，用来定位当前页面的位置的，**一般用于文档**（补充）
- `uuid=xxxx&lang=EN`： 这个是请求参数，一般放在请求地址的后面，请求参数与地址用 `?` 隔开，参数与参数直接用 `&` 隔开（补充）


### `encode`
`encode` 是用来处理中文/特殊字符等情况，防止解析出错的问题。

比如：在 `bing` 上面访问 `c++` 它就会访问 `https://www.bing.com/search?form=QBLH&q=c%2B%2B` 其中 `%2B` 就是 `+` 在 `ASCII` 的16进制表示

## HTTP
### 请求

#### 结构

```Text
GET http://www.msftconnecttest.com/connecttest.txt HTTP/1.1
Connection: Close
User-Agent: Microsoft NCSI
Host: www.msftconnecttest.com


```
就以这个为例，
- 第一行：GET 表示请求的方法，中间那一长串表示URL地址，最后一个是HTTP请求的版本
- 第二行到空行之前，都是请求头，它们是键值对的方式存储
- 空行它在倒数第二行，它是用来区分请求头和请求体
- 请求体这里是没有的

#### 请求方法

请求方法用到最多的两个就是 `GET` 和 `POST`
- `GET`：表示从服务器上**获取数据**
- `POST`：将**数据推送**给服务器

问题：
- `GET` 和 `POST` 有什么区别？（面试题）
    ||
    实际上它们没有什么太大的区别，因为**相互之间是可以互相转换的**
    
    要是正的说区别，还是有的
    1. `GET` 的请求参数是放在 `URL` 上面的，`POST` 的参数是放在请求体里面的
    2. `GET` 是表示获取数据，`POST` 表示输入数据
    ||
### 响应

```Text
HTTP/1.1 200 OK
Content-Length: 22
Cache-Control: max-age=30, must-revalidate
Connection: keep-alive
Content-Type: text/plain
Date: Mon, 31 Aug 2026 06:25:59 GMT
Keep-Alive: timeout=60
Proxy-Connection: keep-alive

Microsoft Connect Test
```
- 第一行：第一个是HTTP请求的版本，第二个是响应码，第三个是响应信息
- 第二行到空行之前，都是响应头，它们是键值对的方式存储
- 空行它在倒数第二行，它是用来区分请求头和请求体
- 响应体表示响应的结果信息
