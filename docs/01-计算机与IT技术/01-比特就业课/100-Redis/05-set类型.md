# 05-set类型
## 命令
### `sadd`, `smembers` 和 `sismember`
`sadd` 是**添加元素**，支持批量添加

`smembers` 是**获取到所有的元素**

`sismember` 是查询指定的**元素是否存在**

### `spop` 和 `srandmember`
`pop` 一般来说是末尾删除，但是在 `set` 中，是没有末尾的概念的，因此 **`spop` 是采用随机删除**

**`srandmember` 也是随机返回一个数**，但是它和 `spop` 不一样的地方是，它不会**删除 `set` 中的元素**

