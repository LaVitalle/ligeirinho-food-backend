-- ==========================================================
-- 1. PREPARATION (EXTENSIONS AND TYPES)
-- ==========================================================

-- Habilita a geração de UUIDs aleatórios
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User access levels
CREATE TYPE user_role AS ENUM ('ADMIN', 'SELLER', 'CUSTOMER');

-- Measurement units for extras
CREATE TYPE measurement_unit AS ENUM ('UNIT', 'GRAMS', 'ML');

-- Order life cycle status
CREATE TYPE order_status AS ENUM (
    'REQUESTED', 
    'PREPARING', 
    'READY_FOR_PICKUP', 
    'PICKED_UP', 
    'CANCELLED'
);

-- Global function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;   
END;
$$ language 'plpgsql';

-- ==========================================================
-- 2. LOCATION AND VISUAL IDENTITY
-- ==========================================================

CREATE TABLE states (
    id INT PRIMARY KEY, -- Código IBGE do Estado
    name VARCHAR(50) UNIQUE NOT NULL,
    abbreviation CHAR(2) UNIQUE NOT NULL -- UF (ex: SP, RJ)
);

CREATE TABLE cities (
    id INT PRIMARY KEY, -- Código IBGE da Cidade
    name VARCHAR(150) NOT NULL,
    state_id INT NOT NULL REFERENCES states(id),
    CONSTRAINT unique_city_per_state UNIQUE (name, state_id)
);

CREATE TABLE icons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL, -- Nome identificador do ícone
    url TEXT NOT NULL, -- Link para o arquivo de imagem/SVG
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_update_icons_updated_at 
    BEFORE UPDATE ON icons FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- Nome da categoria (ex: Bebidas)
    icon_id UUID REFERENCES icons(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_update_categories_updated_at 
    BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================================
-- 3. INSTITUTIONS AND CANTEENS
-- ==========================================================

CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    photo_url TEXT,
    access_code CHAR(6) UNIQUE NOT NULL, -- Código de 6 dígitos para alunos
    state_id INT NOT NULL REFERENCES states(id),
    city_id INT NOT NULL REFERENCES cities(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_update_institutions_updated_at 
    BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE canteens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    profile_photo_url TEXT,
    cover_photo_url TEXT,
    description TEXT, -- Breve descrição da cantina
    opening_time TIME NOT NULL, -- Horário de abertura
    closing_time TIME NOT NULL, -- Horário de fechamento
    is_open_manually BOOLEAN DEFAULT TRUE, -- Controle manual de status aberto/fechado
    physical_location_description TEXT NOT NULL, -- Descrição de onde fica (ex: Bloco A)
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_update_canteens_updated_at 
    BEFORE UPDATE ON canteens FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================================
-- 4. USERS
-- ==========================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number VARCHAR(20),
    profile_photo_url TEXT,
    role user_role NOT NULL,
    institution_id UUID REFERENCES institutions(id), -- Null para Admins Globais
    canteen_id UUID REFERENCES canteens(id), -- Vinculado apenas para Vendedores
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Garante que Vendedores têm sempre cantina vinculada
    CONSTRAINT check_seller_has_canteen CHECK (
        (role = 'SELLER' AND canteen_id IS NOT NULL) OR (role <> 'SELLER')
    )
);

CREATE TRIGGER trg_update_users_updated_at 
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================================
-- 5. MENU (PRODUCTS AND EXTRAS)
-- ==========================================================

CREATE TABLE extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit measurement_unit NOT NULL,
    reference_quantity DECIMAL(10, 2) NOT NULL, -- Valor da unidade (ex: 100g)
    max_quantity_per_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Status de disponibilidade
    canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    icon_id UUID REFERENCES icons(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_update_extras_updated_at 
    BEFORE UPDATE ON extras FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Status de disponibilidade
    canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_update_products_updated_at 
    BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Relacionamento Many-to-Many entre Produtos e Adicionais
CREATE TABLE product_extras_association (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    extra_id UUID REFERENCES extras(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, extra_id)
);

-- ==========================================================
-- 6. CART (TEMPORARY PERSISTENCE)
-- ==========================================================

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    observation TEXT, -- Observações do cliente (ex: Sem cebola)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_item_extras (
    cart_item_id UUID NOT NULL REFERENCES cart_items(id) ON DELETE CASCADE,
    extra_id UUID NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
    PRIMARY KEY (cart_item_id, extra_id)
);

-- ==========================================================
-- 7. PAYMENTS AND SECURITY
-- ==========================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL, -- Ex: Pix, Credit Card
    icon_id UUID REFERENCES icons(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE password_recovery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code CHAR(6) NOT NULL, -- Código numérico de recuperação
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recovery_active_code ON password_recovery(code, user_id) WHERE is_used = FALSE;

-- ==========================================================
-- 8. ORDERS (HISTORY AND EXECUTION)
-- ==========================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    canteen_id UUID NOT NULL REFERENCES canteens(id),
    payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
    
    total_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    scheduled_pickup_time TIMESTAMP WITH TIME ZONE, -- Horário agendado para retirada
    status order_status NOT NULL DEFAULT 'REQUESTED',

    -- Feedback: 0 = not rated, 1-5 = rating
    rating INT DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    rating_comment TEXT, -- Comentário opcional da avaliação
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_update_orders_updated_at 
    BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_at_purchase DECIMAL(10, 2) NOT NULL, -- Histórico do preço do produto
    observation TEXT
);

CREATE TABLE order_item_extras (
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    extra_id UUID NOT NULL REFERENCES extras(id),
    extra_price_at_purchase DECIMAL(10, 2) NOT NULL, -- Histórico do preço do adicional
    PRIMARY KEY (order_item_id, extra_id)
);