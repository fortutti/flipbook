// Скрываем открытую книгу сразу при загрузке скрипта
(function() {
    const openBookWrap = document.querySelector('.book-wrap:last-of-type');
    const closedBookWrap = document.querySelector('.book-wrap:first-of-type');
    
    if (openBookWrap) openBookWrap.style.display = 'none';
    if (closedBookWrap) closedBookWrap.style.display = 'flex';
})();

// Функция для проверки загрузки библиотек
function checkDependencies() {
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (window.jQuery && jQuery.fn.turn) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);

        // Таймаут на случай если библиотеки не загрузятся
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Библиотеки не загрузились'));
        }, 10000);
    });
}

// Основная функция инициализации
function initApp() {
    console.log('DOM загружен, проверяем зависимости...');
    
    // Скрываем открытую книгу при загрузке страницы
    const openBookWrap = document.querySelector('.book-wrap:last-of-type');
    const closedBookWrap = document.querySelector('.book-wrap:first-of-type');
    
    if (openBookWrap) openBookWrap.style.display = 'none';
    if (closedBookWrap) closedBookWrap.style.display = 'flex';
    
    checkDependencies()
        .then(() => {
            console.log('✅ Все зависимости загружены');
            initBook();
        })
        .catch((error) => {
            console.error('❌ Ошибка загрузки зависимостей:', error);
            console.log('jQuery:', typeof jQuery);
            console.log('turn.js:', typeof jQuery.fn.turn);
        });
}

// Ждём, пока DOM и все скрипты загрузятся
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initBook() {
    const closedBookWrap = document.querySelector('.book-wrap:first-of-type');
    const openBookWrap = document.querySelector('.book-wrap:last-of-type');
    const openButton = closedBookWrap?.querySelector('.book__btn.next');
    const prevButton = openBookWrap?.querySelector('.book__btn.prev');
    const nextButton = openBookWrap?.querySelector('.book__btn.next');
    const flipbook = openBookWrap?.querySelector('.flipbook');
    
    // Проверка наличия необходимых элементов
    if (!closedBookWrap || !openBookWrap || !flipbook) {
        console.error('Не найдены необходимые элементы DOM');
        return;
    }

    // Убедимся, что открытая книга скрыта
    openBookWrap.style.display = 'none';
    closedBookWrap.style.display = 'flex';

    const totalPages = 35;
    let isBookOpen = false;
    let turnInstance = null;
    let lastPage = 2;

    // Кэшируем jQuery объект flipbook
    const $flipbook = $(flipbook);

    function openBook() {
        closedBookWrap.style.display = 'none';
        openBookWrap.style.display = 'flex';
        
        // Сначала скрываем содержимое книги, чтобы не было видно мигания
        flipbook.style.opacity = '0';
        flipbook.style.visibility = 'hidden';

        // Используем один таймер вместо нескольких
        setTimeout(() => {
            if (!turnInstance) {
                // Создаём книгу, но НЕ показываем её сразу
                turnInstance = $flipbook.turn({
                    width: 840,
                    height: 570,
                    autoCenter: true,
                    duration: 800,
                    acceleration: true,
                    gradients: true,
                    pages: totalPages,
                    display: 'double',
                    direction: 'ltr',
                    page: 2,
                    when: {
                        turning: function(e, page, view) {
                            // Для перелистывания назад обновляем сразу с минимальной задержкой
                            const isGoingBack = page < lastPage;
                            const delay = isGoingBack ? 50 : 250;
                            setTimeout(updatePageNumbers, delay);
                            lastPage = page;
                        },
                        turned: updatePageNumbers
                    }
                });

                $flipbook.on('turned', updatePageNumbers);
            } else {
                // Если книга уже была создана, поворачиваем на первую страницу
                $flipbook.turn('page', 2);
            }

            // Делаем небольшую задержку, чтобы DOM обновился, потом показываем книгу
            setTimeout(() => {
                flipbook.style.opacity = '1';
                flipbook.style.visibility = 'visible';
                isBookOpen = true;
                lastPage = 2;
                updatePageNumbers();
            }, 50);
        }, 100);
    }

    function closeBook() {
        // При закрытии книги также скрываем её содержимое
        flipbook.style.opacity = '0';
        flipbook.style.visibility = 'hidden';
        
        setTimeout(() => {
            closedBookWrap.style.display = 'flex';
            openBookWrap.style.display = 'none';
            isBookOpen = false;
        }, 100);
    }

    function updatePageNumbers() {
        if (!isBookOpen) return;

        const currentPage = $flipbook.turn('page');
        const displayPage = currentPage === 1 
            ? 0 
            : Math.floor((currentPage - 2) / 2) + 1;
        const text = `${displayPage} / 17`;
        
        // Используем один селектор для всех элементов
        document.querySelectorAll('.page__number').forEach(el => {
            el.textContent = text;
        });
    }

    function handlePrevClick() {
        if (!isBookOpen) return;
        const currentPage = $flipbook.turn('page');
        const currentLogical = currentPage === 1 ? 0 : Math.floor((currentPage - 2) / 2) + 1;
        
        if (currentLogical === 1) {
            closeBook();
        } else {
            $flipbook.turn('previous');
        }
    }

    function handleNextClick() {
        if (!isBookOpen || !$flipbook.turn('page')) return;
        const currentPage = $flipbook.turn('page');
        
        if (currentPage < totalPages) {
            $flipbook.turn('next');
        }
    }

    // === Обработчики событий ===
    if (openButton) openButton.addEventListener('click', openBook);
    if (prevButton) prevButton.addEventListener('click', handlePrevClick);
    if (nextButton) nextButton.addEventListener('click', handleNextClick);
}