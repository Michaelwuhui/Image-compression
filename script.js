document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('previewContainer');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const fullscreenModal = document.getElementById('fullscreenModal');
    const fullscreenImage = document.getElementById('fullscreenImage');
    const fullscreenOriginal = document.getElementById('fullscreenOriginal');
    const fullscreenCompressed = document.getElementById('fullscreenCompressed');
    const fullscreenBtns = document.querySelectorAll('.fullscreen-btn');
    const closeBtn = document.querySelector('.close-btn');
    const fullscreenQualitySlider = document.getElementById('fullscreenQualitySlider');
    const fullscreenQualityValue = document.getElementById('fullscreenQualityValue');

    let originalImage = null;
    let isDragging = false;
    let startX = 0;
    let sliderPosition = 50;

    // 处理上传区域的点击事件
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    // 处理拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#007AFF';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#DEDEDE';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#DEDEDE';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });

    // 处理文件选择
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });

    // 处理图片上传
    function handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage = new Image();
            originalImage.src = e.target.result;
            originalImage.onload = () => {
                originalPreview.src = originalImage.src;
                originalSize.textContent = formatFileSize(file.size);
                compressImage();
                previewContainer.style.display = 'block';
            };
        };
        reader.readAsDataURL(file);
    }

    // 压缩图片
    function compressImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        
        ctx.drawImage(originalImage, 0, 0);
        
        const quality = qualitySlider.value / 100;
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        compressedPreview.src = compressedDataUrl;
        
        // 计算压缩后的文件大小
        const base64Length = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
        const compressedBytes = base64Length * 0.75;
        compressedSize.textContent = formatFileSize(compressedBytes);
    }

    // 处理质量滑块变化
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value + '%';
        if (originalImage) {
            compressImage();
        }
    });

    // 处理下载
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'compressed-image.jpg';
        link.href = compressedPreview.src;
        link.click();
    });

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // 处理全屏预览
    fullscreenBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            // 显示原图和压缩后的图片
            fullscreenOriginal.src = originalImage.src;
            fullscreenCompressed.src = compressedPreview.src;
            // 同步压缩质量滑块
            fullscreenQualitySlider.value = qualitySlider.value;
            fullscreenQualityValue.textContent = qualitySlider.value + '%';
            // 重置滑块位置
            comparisonSlider.style.left = '50%';
            compressedPreviewFullscreen.style.clipPath = 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)';
            fullscreenModal.style.display = 'flex';
        });
    });

    // 处理全屏模式下的质量调节
    fullscreenQualitySlider.addEventListener('input', () => {
        const quality = fullscreenQualitySlider.value;
        // 更新显示的数值
        fullscreenQualityValue.textContent = quality + '%';
        // 同步主界面的滑块
        qualitySlider.value = quality;
        qualityValue.textContent = quality + '%';
        // 重新压缩图片
        compressImage();
        // 更新全屏预览中的压缩图片
        fullscreenCompressed.src = compressedPreview.src;
    });

    // 关闭全屏预览
    closeBtn.addEventListener('click', () => {
        fullscreenModal.style.display = 'none';
    });

    // 点击模态框背景关闭
    fullscreenModal.addEventListener('click', (e) => {
        if (e.target === fullscreenModal) {
            fullscreenModal.style.display = 'none';
        }
    });

    // ESC 键关闭全屏预览
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && fullscreenModal.style.display === 'flex') {
            fullscreenModal.style.display = 'none';
        }
    });

    // 处理滑块拖动
    const comparisonSlider = document.querySelector('.comparison-slider');
    const compressedPreviewFullscreen = document.getElementById('fullscreenCompressed');

    comparisonSlider.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        isDragging = true;
        startX = e.clientX;
        sliderPosition = parseFloat(getComputedStyle(compressedPreviewFullscreen).clipPath.match(/\d+/)[0]);
    }

    function drag(e) {
        if (!isDragging) return;

        const delta = e.clientX - startX;
        const containerWidth = comparisonSlider.parentElement.offsetWidth;
        let newPosition = sliderPosition + (delta / containerWidth * 100);

        // 限制滑块范围在0-100之间
        newPosition = Math.max(0, Math.min(100, newPosition));

        // 更新滑块位置
        comparisonSlider.style.left = `${newPosition}%`;
        compressedPreviewFullscreen.style.clipPath = `polygon(${newPosition}% 0, 100% 0, 100% 100%, ${newPosition}% 100%)`;
    }

    function stopDragging() {
        isDragging = false;
    }

    // 添加触摸支持
    comparisonSlider.addEventListener('touchstart', (e) => {
        startDragging(e.touches[0]);
    });

    document.addEventListener('touchmove', (e) => {
        drag(e.touches[0]);
    });

    document.addEventListener('touchend', stopDragging);
}); 