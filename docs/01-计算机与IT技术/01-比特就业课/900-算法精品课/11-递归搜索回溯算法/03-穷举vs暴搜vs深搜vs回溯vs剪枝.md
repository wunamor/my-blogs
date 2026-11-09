# 03-穷举vs暴搜vs深搜vs回溯vs剪枝

这个本质上就是回溯算法。
## 题目
### [LC46. 全排列](https://leetcode.cn/problems/permutations/)

**全排列本质就是全部都遍历一次，然后把满足条件的遍历出来**，只不过它遍历的层数是由 nums 的长度来决定的，换句话说，它长度有多少，就有几层 for 循环。

解决这类问题，有这几步：
||
- 首先是要把**画出它的决策树，画得越详细越好。**
  > 决策树就是解决的具体的流程，要求不重复不遗漏
- 其次是**设计函数和全局变量**
- 最后思考它的**结束条件，剪枝，回溯**等细节
||

这个题目思路就是这样：
1. 判断一下，哪个没有加入到 `path` 中，如果没有，那么就加入 `path` 中并递归
2. 在递归的过程中
	- 如果**长度不符合**，再把 `nums` 遍历一次，看看哪个是还么有递归过
	- 如果**长度符合**，满足递归的出口，那么就把相关的内容添加到结果中，退出递归
3. 最后**回溯一下，还原一下现场**

```Java
List<List<Integer>> result = new LinkedList<>(); // 结果
boolean[] check; // 查看当前元素是否已经被使用， false: 未使用, true: 已使用 
List<Integer> path = new ArrayList<>(); // 存储路径

public List<List<Integer>> permute(int[] nums) {
	// 初始化条件
	check = new boolean[nums.length];

	dfs(nums);

	return result;
}

void dfs(int[] nums) {
	// 当 path 长度与 nums 长度一样，那么就说明满了，即可返回
	if (nums.length == path.size()) {
		result.add(new LinkedList<>(path));
		return;
	}

	// 全部遍历一次
	for (int index = 0; index < nums.length; index++) {
		if (check[index]) continue; // 如果已经添加，那么就不需要递归了
		// 先添加，再递归，最后回溯（恢复现场）
		check[index] = true;
		path.add(nums[index]);
		dfs(nums);
		check[index] = false;
		path.remove(path.size() - 1);
	}
}
```