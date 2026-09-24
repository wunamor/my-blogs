# 2026-05-06-SpringAOP

`AOP(面向切面)` 是一个思想，它是将**公共的执行步骤给抽离出来**，像之前的统一异常处理，统一接口返回等都是 `AOP` 思想的具体实现

## 核心概念

`SpringAOP` 核心概念有 **切点，连接点，通知，切面**。

以下的方法就以这个代码为例：
```Java
@Aspect  
@Slf4j
@Component  
public class TimeAspect {  
  
    @Around("execution(* com.wunamor.springaopdemo.controller.*.*(..))")  
    public Object executeTime(ProceedingJoinPoint point) throws Throwable {  
        long start = System.currentTimeMillis();  
        Object proceed = point.proceed();  
        log.info(point.getSignature() + " 执行时间为：{} ms", System.currentTimeMillis() - start);  
        return proceed;  
    }  
}
```

### 切点
`execution(* com.wunamor.springaopdemo.controller.*.*(..))` 就是一个切点表达式，**它是一个规则**，用来匹配相关的方法

#### 切点表达式
切点表达式有 `execution` 表达式 和 `annotation` 这个注解

---
##### `execution` 表达式
这个一般是**批量**的处理，比如：返回某个类下的所有方法。

这个有一个问题：如果想要修改方法，那么每一个与 `execution` 的方法都需要修改，这就比较麻烦了。

可以使用 `Pointcut` 这个注解，只需要修改一次 `Pointcut` 就可以解决这个问题

---
##### `@annotation`
这个是自定义的，可以比较**个性化**地针对某个方法/类使用

步骤：
1. 定义注解
2. 定义切面对象，在切面对象里面绑定指定的注解，**这里面写具体的执行逻辑**
3. 在具体的方法上使用这个注解

### 连接点
`ProceedingJoinPoint point` 是连接点，**切点匹配到的方法就是连接点**
### 通知
内部执行的方法，就是大括号的内部，

从 `long start = System.currentTimeMillis();` 到 `return proceed` 之间都是通知
### 切面
**切面 = 切点 + 连接点 + 通知**

`TimeAspect` 就是一个切面类，一个切面类可以有多个切面

## SpringAOP 原理
SpringAOP 是基于代理模式中的动态代理来实现的

它里面**分为JDK动态代理和CGLIB动态代理**，这个了解即可



## 面试题
### SpringAOP 是如何实现呢？

||
1. 使用 `Aspect` 这个注解（常用的）
2. 使用 `annotation` 这个注解，自定义执行方法/对象
3. 基于 Spring API，使用 XML 来实现
||