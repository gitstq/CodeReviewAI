.PHONY: help install install-dev test lint format clean build release

help:
	@echo "CodeReviewAI 开发命令"
	@echo ""
	@echo "  make install      - 安装生产依赖"
	@echo "  make install-dev  - 安装开发依赖"
	@echo "  make test         - 运行测试"
	@echo "  make lint         - 运行代码检查"
	@echo "  make format       - 格式化代码"
	@echo "  make clean        - 清理构建文件"
	@echo "  make build        - 构建包"
	@echo "  make release      - 发布到PyPI"

install:
	pip install -e .

install-dev:
	pip install -e ".[dev]"

test:
	pytest -v

test-cov:
	pytest --cov=codereviewai --cov-report=html --cov-report=term

lint:
	flake8 codereviewai tests
	mypy codereviewai

format:
	black codereviewai tests
	isort codereviewai tests

format-check:
	black --check codereviewai tests

clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build: clean
	python -m build

check:
	twine check dist/*

release: build check
	twine upload dist/*

docker-build:
	docker build -t codereviewai:latest .

docker-run:
	docker run --rm -it codereviewai:latest
