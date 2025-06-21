document.addEventListener('DOMContentLoaded', () => {
    // ゲームの状態
    const gameState = {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        totalPairs: 10, // 10ペア（20枚）に変更
        score: 0,
        canFlip: true,
        lockBoard: false
    };

    // DOM要素
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const pairsElement = document.getElementById('pairs');
    const restartButton = document.getElementById('restart');
    const winMessage = document.getElementById('win-message');
    const playAgainButton = document.getElementById('play-again');
    const finalScoreElement = document.getElementById('final-score');
    
    // サウンドエフェクト
    const sounds = {
        flip: document.getElementById('card-flip'),
        match: document.getElementById('card-match'),
        win: document.getElementById('win-sound'),
        bgm: document.getElementById('bgm')
    };

    // カードの絵柄（10種類の絵柄を2枚ずつ使用）
    const cardSymbols = [
        '🐱', '🐶', '🐰', '🦊', '🐻',  // 動物
        '🍎', '🍓', '🍊', '🍋', '🍇'   // フルーツ
    ];
    
    // 10種類の絵柄を2枚ずつ持つ配列を作成
    const cardPairs = [...cardSymbols, ...cardSymbols];

    // ゲームの初期化
    function initGame() {
        // ゲームボードをリセット
        gameBoard.innerHTML = '';
        
        // ゲーム状態をリセット
        gameState.cards = [];
        gameState.flippedCards = [];
        gameState.matchedPairs = 0;
        gameState.score = 0;
        gameState.canFlip = true;
        gameState.lockBoard = false;
        
        // スコア表示を更新
        updateScore();
        
        // カードをシャッフルして配置
        const shuffledCards = shuffleCards([...cardPairs]);
        
        // カードを生成
        shuffledCards.forEach((symbol, index) => {
            const card = createCard(symbol, index);
            gameBoard.appendChild(card);
            gameState.cards.push({
                element: card,
                symbol: symbol,
                isFlipped: false,
                isMatched: false,
                index: index
            });
        });
        
        // BGMを再生（ユーザーインタラクション後に再生）
        document.addEventListener('click', startBGM, { once: true });
        
        // 勝利メッセージを非表示
        winMessage.classList.remove('show');
    }

    // カードをシャッフル
    function shuffleCards(cards) {
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        return cards;
    }

    // カード要素を作成
    function createCard(symbol, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        cardFront.textContent = symbol;
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        
        cardInner.appendChild(cardBack);
        cardInner.appendChild(cardFront);
        card.appendChild(cardInner);
        
        // カードクリック時のイベントリスナー
        card.addEventListener('click', flipCard);
        
        return card;
    }

    // カードをめくる
    function flipCard() {
        if (!gameState.canFlip || gameState.lockBoard) return;
        
        const index = parseInt(this.dataset.index);
        const card = gameState.cards[index];
        
        // 既にめくられているかマッチ済みのカードは無視
        if (card.isFlipped || card.isMatched) return;
        
        // 同じカードを2回めくらないようにする
        if (gameState.flippedCards.length === 1 && gameState.flippedCards[0] === index) return;
        
        // カードをめくる
        flipCardAnimation(card);
        
        // カードをめくる効果音を再生（少し遅らせて再生）
        setTimeout(() => {
            playSound('card-flip');
        }, 50);
        
        // めくったカードを記録
        gameState.flippedCards.push(index);
        
        // 2枚めくったら判定
        if (gameState.flippedCards.length === 2) {
            checkForMatch();
        }
    }
    
    // カードをめくるアニメーション
    function flipCardAnimation(card) {
        card.isFlipped = true;
        card.element.classList.add('flipped');
    }
    
    // カードを裏返すアニメーション
    function unflipCard(card) {
        card.isFlipped = false;
        card.element.classList.remove('flipped');
    }
    
    // カードのマッチをチェック
    function checkForMatch() {
        gameState.lockBoard = true;
        
        const [firstIndex, secondIndex] = gameState.flippedCards;
        const firstCard = gameState.cards[firstIndex];
        const secondCard = gameState.cards[secondIndex];
        
        // スコアを加算（マッチするかどうかに関わらず）
        gameState.score += 10;
        
        // カードがマッチした場合
        if (firstCard.symbol === secondCard.symbol) {
            // マッチしたカードを無効化
            firstCard.isMatched = true;
            secondCard.isMatched = true;
            
            // マッチエフェクトを表示
            createMatchEffect(firstCard.element);
            createMatchEffect(secondCard.element);
            
            // マッチ音を再生（少し遅らせて再生）
            setTimeout(() => {
                playSound('card-match');
            }, 100);
            
            // ボーナススコアを加算
            gameState.score += 50;
            
            // マッチしたペア数を更新
            gameState.matchedPairs++;
            
            // スコアを更新
            updateScore();
            
            // ゲームクリアチェック
            if (gameState.matchedPairs === gameState.totalPairs) {
                setTimeout(gameOver, 1000);
            } else {
                // 次のターンへ
                resetTurn();
            }
        } else {
            // マッチしなかった場合、カードを裏返す
            setTimeout(() => {
                unflipCard(firstCard);
                unflipCard(secondCard);
                resetTurn();
            }, 1000);
        }
    }
    
    // マッチエフェクトを作成
    function createMatchEffect(cardElement) {
        const rect = cardElement.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // ハートエフェクト
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart';
                heart.textContent = '❤️';
                heart.style.left = `${x}px`;
                heart.style.top = `${y}px`;
                heart.style.fontSize = `${Math.random() * 20 + 20}px`;
                document.body.appendChild(heart);
                
                // アニメーション終了後に要素を削除
                setTimeout(() => {
                    heart.remove();
                }, 1000);
            }, i * 100);
        }
        
        // キラキラエフェクト
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = `${x + (Math.random() - 0.5) * 100}px`;
                confetti.style.top = `${y + (Math.random() - 0.5) * 100}px`;
                confetti.style.backgroundColor = getRandomColor();
                document.body.appendChild(confetti);
                
                // アニメーション
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 100;
                const duration = 1000 + Math.random() * 1000;
                
                confetti.animate([
                    { 
                        transform: 'translate(0, 0) rotate(0deg)',
                        opacity: 1 
                    },
                    { 
                        transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(360deg)`,
                        opacity: 0 
                    }
                ], {
                    duration: duration,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                });
                
                // アニメーション終了後に要素を削除
                setTimeout(() => {
                    confetti.remove();
                }, duration);
            }, i * 50);
        }
    }
    
    // ランダムな色を取得
    function getRandomColor() {
        const pastelColors = [
            '#FFD1DC', '#FFECB8', '#B5EAD7', '#B8E8FC', 
            '#D4A5E5', '#FF9AA2', '#FFB7B2', '#FFDAC1', 
            '#E2F0CB', '#B5EAD7', '#C7CEEA', '#F8B195', 
            '#F67280', '#C06C84', '#6C5B7B', '#355C7D'
        ];
        return pastelColors[Math.floor(Math.random() * pastelColors.length)];
    }
    
    // ターンをリセット
    function resetTurn() {
        gameState.flippedCards = [];
        gameState.lockBoard = false;
        updateScore();
    }
    
    // スコアを更新
    function updateScore() {
        scoreElement.textContent = gameState.score;
        pairsElement.textContent = `${gameState.matchedPairs}/${gameState.totalPairs}`;
    }
    
    // ゲームオーバー
    function gameOver() {
        // 効果音を再生
        playSound('win');
        
        // 最終スコアを表示
        finalScoreElement.textContent = gameState.score;
        
        // 勝利メッセージを表示
        winMessage.classList.add('show');
    }
    
    // サウンドを再生
    function playSound(soundName) {
        console.log(`Playing sound: ${soundName}`);
        try {
            const sound = sounds[soundName];
            if (!sound) {
                console.error(`Sound not found: ${soundName}`);
                return;
            }
            
            // 音声をクローンして再生（連続再生を可能にするため）
            const soundClone = sound.cloneNode();
            soundClone.volume = soundName === 'bgm' ? 0.3 : 0.5;
            
            const playPromise = soundClone.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log(`音声再生エラー (${soundName}):`, error);
                    // ユーザーインタラクションを待って再生を試みる
                    const playAfterInteraction = () => {
                        soundClone.play().catch(e => console.log(`再試行エラー (${soundName}):`, e));
                        document.body.removeEventListener('click', playAfterInteraction);
                        document.body.removeEventListener('keydown', playAfterInteraction);
                        document.body.removeEventListener('touchstart', playAfterInteraction);
                    };
                    
                    document.body.addEventListener('click', playAfterInteraction, { once: true });
                    document.body.addEventListener('keydown', playAfterInteraction, { once: true });
                    document.body.addEventListener('touchstart', playAfterInteraction, { once: true });
                });
            }
            
            // 再生後に要素を削除（メモリリーク防止）
            soundClone.onended = () => {
                if (soundName !== 'bgm') {
                    soundClone.remove();
                }
            };
            
        } catch (e) {
            console.error(`サウンド再生エラー (${soundName}):`, e);
        }
    }
    
    // BGMを再生（ユーザーインタラクション後に呼び出す）
    function startBGM() {
        try {
            const bgm = sounds.bgm;
            bgm.volume = 0.3;
            
            // ユーザーインタラクション後に再生を試みる
            const playBGM = () => {
                const playPromise = bgm.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('BGM再生エラー:', error);
                        // ユーザーインタラクションを待って再試行
                        document.body.addEventListener('click', function retryBGM() {
                            bgm.play().catch(e => console.log('BGM再試行エラー:', e));
                            document.body.removeEventListener('click', retryBGM);
                        }, { once: true });
                    });
                }
            };
            
            // すでにユーザーインタラクションがあれば再生、なければイベントリスナーを設定
            if (document.readyState === 'complete') {
                playBGM();
            } else {
                window.addEventListener('load', playBGM, { once: true });
            }
            
            // ユーザーが初めてインタラクションしたときに再生を試みる
            const handleFirstInteraction = () => {
                playBGM();
                document.removeEventListener('click', handleFirstInteraction);
                document.removeEventListener('keydown', handleFirstInteraction);
                document.removeEventListener('touchstart', handleFirstInteraction);
            };
            
            document.addEventListener('click', handleFirstInteraction, { once: true });
            document.addEventListener('keydown', handleFirstInteraction, { once: true });
            document.addEventListener('touchstart', handleFirstInteraction, { once: true });
            
        } catch (e) {
            console.log('BGM初期化エラー:', e);
        }
    }
    
    // イベントリスナー
    restartButton.addEventListener('click', initGame);
    playAgainButton.addEventListener('click', initGame);
    
    // ゲームを初期化
    initGame();
});
