# 03-Service层
## `command` 模块的作用
`command` 的对象是 `Service` 所需要的内容。它可以有如下好处
1. 解耦，把 `controller` 层的参数与 service 层的参数经行**解耦**
2. 可以比较**清晰地知道** `service` 层需要哪些**参数**
3. 之后在其他地方调用 `service` 层比较方便（比如 `RabbitMQ` 等），只需要实现 `command` 中的对象就可以了