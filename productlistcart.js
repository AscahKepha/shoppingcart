// --- DOM Element References ---
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
const cartItemsList = document.getElementById('cartItemsList');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const cartItemCountSpan = document.getElementById('cartItemCount');
const cartTotalPriceSpan = document.getElementById('cartTotalPrice');
const cartTotalContainer = document.getElementById('cartTotalContainer');
const confirmOrderBtn = document.getElementById('confirmOrderBtn'); // New: Confirm Order button
const orderConfirmationModal = document.getElementById('orderConfirmationModal'); // New: Modal overlay
const modalCartItems = document.getElementById('modalCartItems'); // New: Modal's cart items list
const modalTotalPriceSpan = document.getElementById('modalTotalPrice'); // New: Modal's total price
const startNewOrderBtn = document.getElementById('startNewOrderBtn'); // New: Start New Order button

// --- Global Cart State ---
// Stores items in the cart: { productId: { name, price, quantity } }
let cart = {};

// --- Helper Functions ---

/**
 * Renders the cart items in the UI and updates total price/count.
 */
function renderCart() {
    // Clear existing items
    cartItemsList.innerHTML = '';
    let totalItems = 0;
    let totalPrice = 0;

    // Check if cart is empty
    const cartIsEmpty = Object.keys(cart).length === 0;
    emptyCartMessage.style.display = cartIsEmpty ? 'flex' : 'none';
    cartTotalContainer.style.display = cartIsEmpty ? 'none' : 'block';

    if (cartIsEmpty) {
        confirmOrderBtn.disabled = true; // Disable confirm button if cart is empty
        confirmOrderBtn.style.opacity = 0.6; // Visual feedback for disabled
        confirmOrderBtn.style.cursor = 'not-allowed';
    } else {
        confirmOrderBtn.disabled = false; // Enable confirm button
        confirmOrderBtn.style.opacity = 1;
        confirmOrderBtn.style.cursor = 'pointer';
    }


    for (const productId in cart) {
        const item = cart[productId];
        totalItems += item.quantity;
        totalPrice += item.quantity * item.price;

        // Create cart item HTML structure
        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');
        cartItemDiv.setAttribute('data-product-id', productId); // Store product ID on the cart item

        cartItemDiv.innerHTML = `
            <div class="cart-item-info">
                <p class="cart-item-name">${item.name}</p>
                <p class="cart-item-quantity-price">
                    ${item.quantity} x $${item.price.toFixed(2)} = <span>$${(item.quantity * item.price).toFixed(2)}</span>
                </p>
            </div>
            <button class="remove-item-btn" data-product-id="${productId}">
                <img src="assets/images/icon-remove-item.svg" alt="Remove item">
            </button>
        `;
        cartItemsList.appendChild(cartItemDiv);
    }

    cartItemCountSpan.textContent = totalItems;
    cartTotalPriceSpan.textContent = `$${totalPrice.toFixed(2)}`;

    // Attach event listeners to newly created remove buttons
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', handleRemoveItem);
    });
}

/**
 * Handles adding/incrementing items when an "Add to Cart" button is clicked.
 * @param {Event} event - The click event object.
 */
function handleAddToCartClick(event) {
    const button = event.currentTarget; // The button that was clicked
    const productId = button.dataset.productId;
    const productName = button.dataset.productName;
    const productPrice = parseFloat(button.dataset.productPrice); // Convert price to number

    if (cart[productId]) {
        // Item already in cart, increment quantity
        cart[productId].quantity++;
    } else {
        // Item not in cart, add new item
        cart[productId] = {
            name: productName,
            price: productPrice,
            quantity: 1
        };
    }

    // Update the button's UI to show quantity selector
    updateProductButtonUI(button, productId);

    renderCart(); // Re-render the cart UI
}

/**
 * Updates the UI of a product's "Add to Cart" button to a quantity selector.
 * @param {HTMLElement} button - The original "Add to Cart" button element.
 * @param {string} productId - The ID of the product.
 */
function updateProductButtonUI(button, productId) {
    const currentQuantity = cart[productId] ? cart[productId].quantity : 0;

    button.classList.add('quantity-selector');
    button.innerHTML = `
        <button class="quantity-btn decrement-btn" data-product-id="${productId}">
            <img src="assets/images/icon-decrement-quantity.svg" alt="Decrement quantity">
        </button>
        <span class="quantity-display">${currentQuantity}</span>
        <button class="quantity-btn increment-btn" data-product-id="${productId}">
            <img src="assets/images/icon-increment-quantity.svg" alt="Increment quantity">
        </button>
    `;

    // Re-attach event listeners to the new quantity buttons
    button.querySelector('.decrement-btn').addEventListener('click', handleQuantityChange);
    button.querySelector('.increment-btn').addEventListener('click', handleQuantityChange);
}

/**
 * Handles incrementing or decrementing item quantities from the product card buttons.
 * @param {Event} event - The click event object.
 */
function handleQuantityChange(event) {
    event.stopPropagation(); // Prevent the parent button's click listener from firing again
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    const type = button.classList.contains('increment-btn') ? 'increment' : 'decrement';
    const parentButton = button.closest('.add-to-cart-btn'); // Get the main add-to-cart button

    if (type === 'increment') {
        cart[productId].quantity++;
    } else if (type === 'decrement') {
        cart[productId].quantity--;
        if (cart[productId].quantity <= 0) {
            delete cart[productId]; // Remove item if quantity drops to 0 or less
        }
    }

    // If item removed or quantity changed, update the product button UI
    if (!cart[productId] || cart[productId].quantity === 0) {
        // Reset button to initial "Add to Cart" state
        parentButton.classList.remove('quantity-selector');
        parentButton.innerHTML = `<img src="assets/images/icon-add-to-cart.svg" alt="Add to cart icon"> Add to Cart`;
        // Re-attach the original add-to-cart listener
        parentButton.addEventListener('click', handleAddToCartClick);
    } else {
        // Update quantity display in the button
        parentButton.querySelector('.quantity-display').textContent = cart[productId].quantity;
    }

    renderCart(); // Re-render the cart UI
}

/**
 * Handles removing an item from the cart from the cart list itself.
 * @param {Event} event - The click event object.
 */
function handleRemoveItem(event) {
    const button = event.currentTarget;
    const productId = button.dataset.productId;

    // Find the original product button and reset its UI
    const productButton = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`);
    if (productButton) {
        productButton.classList.remove('quantity-selector');
        productButton.innerHTML = `<img src="assets/images/icon-add-to-cart.svg" alt="Add to cart icon"> Add to Cart`;
        // Re-attach the original add-to-cart listener
        productButton.addEventListener('click', handleAddToCartClick);
    }

    delete cart[productId]; // Remove item from cart state
    renderCart(); // Re-render the cart UI
}

/**
 * Displays the order confirmation modal with current cart items.
 */
function showOrderConfirmation() {
    modalCartItems.innerHTML = ''; // Clear previous items in modal
    let totalOrderPrice = 0;

    for (const productId in cart) {
        const item = cart[productId];
        totalOrderPrice += item.quantity * item.price;

        const modalItemDiv = document.createElement('div');
        modalItemDiv.classList.add('modal-cart-item');
        modalItemDiv.innerHTML = `
            <div class="modal-cart-item-info">
                <p class="modal-cart-item-name">${item.name}</p>
                <p class="modal-cart-item-qty-price">
                    ${item.quantity} x $${item.price.toFixed(2)} = <span>$${(item.quantity * item.price).toFixed(2)}</span>
                </p>
            </div>
        `;
        modalCartItems.appendChild(modalItemDiv);
    }

    modalTotalPriceSpan.textContent = `$${totalOrderPrice.toFixed(2)}`;
    orderConfirmationModal.classList.add('active'); // Show the modal
}

/**
 * Resets the cart and hides the order confirmation modal.
 */
function startNewOrder() {
    // Reset cart state
    cart = {};

    // Reset all product buttons to "Add to Cart" state
    document.querySelectorAll('.add-to-cart-btn.quantity-selector').forEach(button => {
        const productId = button.dataset.productId;
        button.classList.remove('quantity-selector');
        button.innerHTML = `<img src="assets/images/icon-add-to-cart.svg" alt="Add to cart icon"> Add to Cart`;
        button.addEventListener('click', handleAddToCartClick); // Re-attach listener
    });

    // Hide the modal
    orderConfirmationModal.classList.remove('active');

    // Re-render the main cart (which will now be empty)
    renderCart();
}


// --- Initial Setup and Event Listeners ---
// Attach event listeners to all initial "Add to Cart" buttons
addToCartButtons.forEach(button => {
    button.addEventListener('click', handleAddToCartClick);
});

// Attach event listener for the "Confirm Order" button
confirmOrderBtn.addEventListener('click', showOrderConfirmation);

// Attach event listener for the "Start New Order" button in the modal
startNewOrderBtn.addEventListener('click', startNewOrder);

// Initial render of the cart (it will be empty)
renderCart();
