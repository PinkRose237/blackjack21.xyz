const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suits = ['♠', '♥', '♦', '♣'];

let currentScenario = null;

const elements = {
    dealerCards: document.getElementById('dealer-cards'),
    playerCards: document.getElementById('player-cards'),
    playerTotal: document.getElementById('player-total'),
    hitBtn: document.getElementById('hit-btn'),
    standBtn: document.getElementById('stand-btn'),
    doubleBtn: document.getElementById('double-btn'),
    splitBtn: document.getElementById('split-btn'),
    feedback: document.getElementById('feedback'),
    feedbackText: document.getElementById('feedback-text'),
    nextBtn: document.getElementById('next-btn')
};

function getCardValue(card, currentTotal) {
    if (['J', 'Q', 'K'].includes(card)) return 10;
    if (card === 'A') {
        return currentTotal + 11 <= 21 ? 11 : 1;
    }
    return parseInt(card);
}

function calculateHandTotal(hand) {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
        if (card === 'A') {
            aces++;
        } else if (['J', 'Q', 'K', '10'].includes(card)) {
            total += 10;
        } else {
            total += parseInt(card);
        }
    }

    for (let i = 0; i < aces; i++) {
        if (total + 11 <= 21) {
            total += 11;
        } else {
            total += 1;
        }
    }
    return total;
}

function getRandomCard() {
    return cards[Math.floor(Math.random() * cards.length)];
}

function createCardElement(val) {
    const cardDiv = document.createElement('div');
    const isRed = ['♥', '♦'].includes(suits[Math.floor(Math.random() * suits.length)]);
    cardDiv.className = `card ${isRed ? 'red' : ''}`;
    cardDiv.innerText = val;
    return cardDiv;
}

function generateScenario() {
    const dealerCard = getRandomCard();
    let playerCard1 = getRandomCard();
    let playerCard2 = getRandomCard();

    // Bias towards more interesting scenarios
    if (Math.random() > 0.7) {
        playerCard1 = 'A'; // Soft hand
    } else if (Math.random() > 0.8) {
        playerCard2 = playerCard1; // Pair
    }

    currentScenario = {
        dealer: [dealerCard],
        player: [playerCard1, playerCard2]
    };

    updateUI();
}

function updateUI() {
    elements.dealerCards.innerHTML = '';
    elements.dealerCards.appendChild(createCardElement(currentScenario.dealer[0]));

    elements.playerCards.innerHTML = '';
    currentScenario.player.forEach(card => {
        elements.playerCards.appendChild(createCardElement(card));
    });

    const total = calculateHandTotal(currentScenario.player);
    elements.playerTotal.innerText = total;

    elements.splitBtn.disabled = currentScenario.player[0] !== currentScenario.player[1];
    elements.feedback.classList.add('hidden');
    enableButtons(true);
}

function enableButtons(enable) {
    elements.hitBtn.disabled = !enable;
    elements.standBtn.disabled = !enable;
    elements.doubleBtn.disabled = !enable;
    if (currentScenario.player[0] === currentScenario.player[1]) {
        elements.splitBtn.disabled = !enable;
    }
}

function checkAction(action) {
    const playerHand = currentScenario.player;
    const dealerUpcard = currentScenario.dealer[0];
    const playerTotal = calculateHandTotal(playerHand);
    const dealerVal = getCardValue(dealerUpcard, 0);
    
    let correctAction = '';
    let reason = '';

    const isSoft = playerHand.includes('A') && playerTotal <= 21;
    const isPair = playerHand.length === 2 && playerHand[0] === playerHand[1];

    if (isPair) {
        const pairCard = playerHand[0];
        if (pairCard === 'A' || pairCard === '8') {
            correctAction = 'Split';
            reason = `Always split Aces and 8s.`;
        } else if (pairCard === '10' || pairCard === 'J' || pairCard === 'Q' || pairCard === 'K') {
            correctAction = 'Stand';
            reason = 'Never split 10s.';
        } else if (pairCard === '9') {
            if ([2, 3, 4, 5, 6, 8, 9].includes(dealerVal)) {
                correctAction = 'Split';
            } else {
                correctAction = 'Stand';
            }
            reason = 'Split 9s against dealer 2-9 (except 7).';
        } else if (pairCard === '5') {
            correctAction = 'Double Down';
            reason = 'Treat a pair of 5s like a hard 10. Double against 2-9.';
        } else {
            // Simple rule for other pairs
            if (dealerVal <= 7) correctAction = 'Split';
            else correctAction = 'Hit';
            reason = `Split low pairs if the dealer shows a 7 or lower.`;
        }
    } else if (isSoft) {
        if (playerTotal >= 19) {
            correctAction = 'Stand';
            reason = 'Always stand on Soft 19 or higher.';
        } else if (playerTotal === 18) {
            if (dealerVal <= 6) correctAction = 'Double Down';
            else if (dealerVal <= 8) correctAction = 'Stand';
            else correctAction = 'Hit';
            reason = 'Soft 18: Double vs low dealer, Stand vs 7-8, Hit vs 9-A.';
        } else {
            if ([4, 5, 6].includes(dealerVal)) correctAction = 'Double Down';
            else correctAction = 'Hit';
            reason = 'Soft 17 or lower: Double against dealer 4-6, else Hit.';
        }
    } else {
        // Hard totals
        if (playerTotal >= 17) {
            correctAction = 'Stand';
            reason = 'Stand on hard 17 or higher.';
        } else if (playerTotal >= 13) {
            if (dealerVal <= 6) correctAction = 'Stand';
            else correctAction = 'Hit';
            reason = 'Stand on 13-16 if dealer shows a bust card (2-6).';
        } else if (playerTotal === 12) {
            if (dealerVal >= 4 && dealerVal <= 6) correctAction = 'Stand';
            else correctAction = 'Hit';
            reason = 'Only stand on 12 if dealer shows 4, 5, or 6.';
        } else if (playerTotal === 11) {
            correctAction = 'Double Down';
            reason = 'Always double on 11.';
        } else if (playerTotal === 10) {
            if (dealerVal <= 9) correctAction = 'Double Down';
            else correctAction = 'Hit';
            reason = 'Double on 10 unless dealer shows 10 or Ace.';
        } else if (playerTotal === 9) {
            if (dealerVal >= 3 && dealerVal <= 6) correctAction = 'Double Down';
            else correctAction = 'Hit';
            reason = 'Double on 9 if dealer shows 3-6.';
        } else {
            correctAction = 'Hit';
            reason = 'Always hit on 8 or lower.';
        }
    }

    if (action === correctAction) {
        elements.feedbackText.innerHTML = `<span style="color: #4CAF50; font-weight: bold;">Correct!</span> ${reason}`;
    } else {
        elements.feedbackText.innerHTML = `<span style="color: #f44336; font-weight: bold;">Incorrect.</span> The correct move was <strong>${correctAction}</strong>. ${reason}`;
    }

    elements.feedback.classList.remove('hidden');
    enableButtons(false);
}

elements.hitBtn.addEventListener('click', () => checkAction('Hit'));
elements.standBtn.addEventListener('click', () => checkAction('Stand'));
elements.doubleBtn.addEventListener('click', () => checkAction('Double Down'));
elements.splitBtn.addEventListener('click', () => checkAction('Split'));
elements.nextBtn.addEventListener('click', generateScenario);

// Initialize
generateScenario();