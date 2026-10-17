# 06-zset类型
`zset` 是一个有序的集合，它是**支持升序和降序**，为了方便升序/降序，它**引入了 `score` 来作为标准**。同样，它里面的**元素值是不能重复**的，当然 `score` 是可以重复的
## 命令
### `zadd` 

`zadd` 是用来添加，后面是按照 “分数-值” 来输入，同样是支持批量添加。

它还有一下几个参数
- `incr`：**增加分数，返回的是分数的值**，但是它是不支持批量增加
- `nx/xx`: 这个和之前的内容一样，就不重复叙述了
- `ch`: **返回的值会考虑分数改变的情况**，默认情况是不考虑分数改变的情况


### `zcard` 和 `zcount`
`zcard` 是直接获取到所有的元素个数

`zcount` 是获取到指定范围内的元素个数，
> `zcount` 如果想要获取到开区间的内容，那么就必须要使用 `(` 来获取开区间，
> 
> **反直觉的是如果亚欧哦去到 (10, 20) 区间内的值，那就要写为 `zcount k1 (10 (20`** 而不是写为 `zcount k1 (10 20)`

---
疑问：

为什么 `Redis` 不直接改为符合直觉的写法呢？
||
`Redis` 作为一个被广泛运用于各种业务的组件，**它必须要考虑兼容性的问题**，因此修改是一个比较麻烦的事情

如果不考虑兼容性，那么扩展是一个很难的事情：比如 `C++` 就是一个很好的正面例子，而 `IPv6` 就是一个经典反例

如果真的要改动，那么就需要**循序渐进**地改动：先把旧的表明为弃用，推出新的解决方案，然后过若干个版本后再正式删除
||

为什么 `zcount` 的时间复杂度为 $logN$ 呢？
||
因为 **`zset` 内部会根据分数经行一个排名**，它是可以通过排名直接计算出中间内部有多少个元素
||

### `zrange`, `zrevrange` 和 `zrangebyscore`

`zrange` 是来获取范围内的内容，它的使用和 [`list` 类型](<./04-list类型.md>) 中的 `lrange` 一样，同样也是支持负数的

`rev` 是 `reverse` 缩写，因此 `zrevrange` 是获取到**逆序的**（降序）数值

`zrangebyscore` 它是**根据分数来获取**，分数的规则和 `zcount` 一样，但是已经表明为弃用

### `zpopmax` 和 `bzpopmax`
`zpopmax` 是删除分数最大的元素。`bzpopmax` 是阻塞删除，这里的 b 就是 block 的意思

疑问：`zpopmax` 的时间复杂度为 $O(\log N)$ 那么为什么不能变为 $O(1)$ 呢？
||
**可以通过记录末尾的下标值，然后通过尾删这样操作来删除**。但是 Redis 大佬为什么不这样优化呢？

优化一般情况下是要优化到刀刃上面，可以参考 [01-导言-如何高效学习](<../../../00-学习技巧/01-导言-如何高效学习.md#对自己有好处的就一定要去做吗>) 来思考
||

### `zpopmin` 和 `bzpopmin`
`zpopmin` 是删除最小的元素

`bzpopmin` 和 `zpopmin` 一样，是删除最小的元素，但是它是会阻塞等待


### `zrank`, `zrevrank` 和 `zscore` 

`rank` 是排名的意思，`zrank` 是获取到它当前的排名，`zrevrank` 是获取到它相反的排名，`zscore` 是获取到指定成员的分数

### `zrem`, `zremrangebyscore` 和 `zremrangebybank`

`zrem` 是删除指定成员内容，`zremrangebyscore` 是根据分数来删除， `zremrangebybank` 是根据排名来删除

### `zincrby` 
`zincrby` 是增加分数

### zinterstore 和 zunionstore
`ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]`

- `destination`: 存储的地址
- `numkeys`: 后面 key 的元素数量
- `WEIGHTS`: 权重，可以设置为小数
- `AGGREGATE`: 成员对象相同的时候，采取的措施，默认是求和

`zunionstore` 用法和 `zinterstore` 基本一致，就不详细说明了

## 应用场景
### 排行榜
各种各样的排行榜都可以用（参考）这个有序集合。比如热搜就可以用这个来存储，**分数可以用热度来表示，成员存储各种各样的 id.**

如果是比较复杂的内容，需要**综合考虑各种因素**，那么还可以使用权重（weights）来计算
