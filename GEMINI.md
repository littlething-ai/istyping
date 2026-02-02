

## 关于 Git 操作

- 首要，确保不要提交非必要文件
    - 检查仓库 `.gitigonre` 设置是否正确
    - 检查 `git status`
- 提交时，根据当前工作，书写合适的 commit message
    - 简要为主
    - 如果修改少，尽量一行说清楚。如果修改多，请按照实际来
- 永远不要执行 `git push`
- 永远不要执行 `git commit`，除非 prompt 有**明确**要求 commit
- 特别注意，此项目特别，如果改了 `backend` 目录下的代码，需要 `cd backend` 后提交
    - 因为根目录是开源的，`backend` 为了 SAAS 商业化，不开源，所以在另外的工程 



## 关于编辑文件

- 永远不要修改 `工程根目录/ref` 下的任何文件
