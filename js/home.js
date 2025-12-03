document.addEventListener('DOMContentLoaded', () => {
            const productList = document.getElementById('product-list');
            const errorMsg = document.getElementById('error-msg');
            const cartItemsContainer = document.getElementById('cart-items');
            const cartTotalElement = document.getElementById('cart-total');
            const cartCountElement = document.getElementById('cart-count');
            const cartModal = document.getElementById('cart-modal');

            let allProducts = [];
            let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];
            const formatter = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

            // CONFIGURACIÓN API (Proxy para CORS)
            const API_REAL = 'https://coffeu-16727117187.europe-west1.run.app/products/';
            const PROXY_URL = 'https://corsproxy.io/?' + encodeURIComponent(API_REAL);

            async function loadProducts() {
                try {
                    const response = await fetch(PROXY_URL);
                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("text/html")) throw new Error("Proxy Error: HTML Recibido");

                    const data = await response.json();
                    
                    allProducts = data.map(p => ({
                        id: p.id,
                        name: p.name || 'Café',
                        description: p.description || '',
                        price: parseFloat(p.price) || 0,
                        imageUrl: p.imageUrl || 'https://via.placeholder.com/300?text=Sin+Imagen'
                    }));

                    renderProducts(allProducts);

                } catch (error) {
                    console.error("Error:", error);
                    mostrarError(error);
                }
                updateCartUI();
            }

            function renderProducts(products) {
                productList.innerHTML = '';
                products.forEach(p => {
                    productList.innerHTML += `
                        <div class="product-card">
                            <div class="image-container">
                                <img src="${p.imageUrl}" class="product-image" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300?text=Error+Carga'">
                            </div>
                            <div class="product-info">
                                <h3>${p.name}</h3>
                                <p style="color:#666; font-size:0.9em; flex-grow: 1;">${p.description}</p>
                                <div class="price-tag">${formatter.format(p.price)}</div>
                                <button class="btn-add" onclick="addToCart(${p.id})">Agregar al Carrito</button>
                            </div>
                        </div>`;
                });
            }

            function mostrarError(error) {
                errorMsg.style.display = 'block';
                errorMsg.innerHTML = `<strong>Error de conexión:</strong> ${error.message}`;
                allProducts = [{id:1, name:'Producto Demo', description:'Sin conexión', price:10.00, imageUrl:'https://via.placeholder.com/300'}];
                renderProducts(allProducts);
            }

            window.addToCart = (id) => {
                const p = allProducts.find(x => x.id==id);
                if(!p) return;
                const item = cart.find(x => x.id==id);
                if(item) item.quantity++; else cart.push({...p, quantity:1});
                updateCartUI(); saveCart(); cartModal.style.display='block';
            };
            
            window.changeQty = (id, change) => {
                const item = cart.find(x => x.id==id);
                if(item){
                    item.quantity += change;
                    if(item.quantity <= 0) cart = cart.filter(x => x.id != id);
                    updateCartUI();
                }
            }

            function updateCartUI() {
                const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                cartTotalElement.innerText = formatter.format(total);
                cartCountElement.innerText = cart.reduce((sum, i) => sum + i.quantity, 0);
                
                cartItemsContainer.innerHTML = '';
                if(cart.length === 0) {
                    cartItemsContainer.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Carrito vacío 🛒</p>';
                    return;
                }

                cart.forEach(i => {
                    cartItemsContainer.innerHTML += `
                        <div class="cart-item">
                            <div>
                                <h4>${i.name}</h4>
                                <span style="color:#666; font-size:0.9rem;">${formatter.format(i.price)} c/u</span>
                            </div>
                            <div class="qty-controls">
                                 <button class="btn-qty" onclick="changeQty(${i.id}, -1)">-</button>
                                 <span class="qty-text">${i.quantity}</span>
                                 <button class="btn-qty" onclick="changeQty(${i.id}, 1)">+</button>
                            </div>
                        </div>`;
                });
                saveCart();
            }
            function saveCart() { localStorage.setItem('shoppingCart', JSON.stringify(cart)); }

            document.getElementById('cart-btn').onclick = () => cartModal.style.display = 'block';
            document.getElementById('close-cart').onclick = () => cartModal.style.display = 'none';
            window.onclick = (e) => { if(e.target==cartModal) cartModal.style.display='none'; };
            document.getElementById('logoutButton').onclick = () => { localStorage.removeItem('accessToken'); window.location.href='login.html'; };

            loadProducts();
        });