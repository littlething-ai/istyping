import subprocess
import sys

# === 配置区 ===
DEPLOY_REMOTE_NAME = "deploy-mirror"
DEPLOY_REPO_URL = "https://github.com/waqiju/istyping_deploy.git"
TARGET_BRANCH = "main"  # Vessels 通常监听 main 分支

def run_command(cmd):
    """执行系统命令并返回结果"""
    print(f"执行命令: {' '.join(cmd)}")
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        if result.stdout:
            print(result.stdout.strip())
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        print(f"错误: 命令执行失败")
        print(f"状态码: {e.returncode}")
        print(f"错误输出: {e.stderr.strip()}")
        return False, e.stderr

def sync():
    print("开始同步流程...")

    # 1. 检查远程仓库是否已添加
    _, remotes = run_command(["git", "remote"])
    if DEPLOY_REMOTE_NAME not in remotes:
        print(f"未发现远程仓库 {DEPLOY_REMOTE_NAME}，正在添加...")
        success, _ = run_command(["git", "remote", "add", DEPLOY_REMOTE_NAME, DEPLOY_REPO_URL])
        if not success:
            return
    else:
        # 确保 URL 是最新的
        run_command(["git", "remote", "set-url", DEPLOY_REMOTE_NAME, DEPLOY_REPO_URL])

    # 2. 获取当前分支名称
    _, current_branch = run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    current_branch = current_branch.strip()
    print(f"当前分支: {current_branch}")

    # 3. 推送镜像到部署仓库
    # 使用 HEAD:main 确保无论本地是什么分支，都推送到远程的 main
    print(f"正在推送镜像到 {DEPLOY_REPO_URL}...")
    success, _ = run_command([
        "git", "push", 
        DEPLOY_REMOTE_NAME, 
        f"HEAD:{TARGET_BRANCH}", 
        "--force"
    ])

    if success:
        print("\n" + "="*30)
        print("同步成功！")
        print(f"代码已强制推送到 {DEPLOY_REMOTE_NAME}/{TARGET_BRANCH}")
        print("Vessels 应该会开始自动构建。")
        print("="*30)
    else:
        print("\n同步失败，请检查上方错误信息。")

if __name__ == "__main__":
    # 确保在 git 仓库中运行
    try:
        subprocess.run(["git", "rev-parse", "--is-inside-work-tree"], check=True, capture_output=True)
    except:
        print("错误: 请在 Git 仓库根目录下运行此脚本。")
        sys.exit(1)
        
    sync()
