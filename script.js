const columns = [
    document.getElementById("column1"),
    document.getElementById("column2"),
    document.getElementById("column3"),
    document.getElementById("column4")
];

let nextColumn = 0;

const addFolderButton = document.getElementById("addFolder");
const dashboard = document.getElementById("dashboard");

const contextMenu = document.getElementById("contextMenu");
const editOption = document.getElementById("editOption");
const deleteOption = document.getElementById("deleteOption");
const importIconOption = document.getElementById("importIconOption");
const restoreIconOption = document.getElementById("restoreIconOption");

// Input de arquivo (escondido) usado para importar um ícone customizado para um site
const faviconInput = document.getElementById("faviconInput");

const settingsButton = document.getElementById("settingsButton");
const settingsMenu = document.getElementById("settingsMenu");
const changeWallpaper = document.getElementById("changeWallpaper");
const wallpaperInput = document.getElementById("wallpaperInput");
const resetWallpaper = document.getElementById("resetWallpaper");

let currentSite = null;

/* ============================================================
   Ícone das pastas (emoji pré-definido ou imagem importada)
   ============================================================ */

const DEFAULT_FOLDER_ICON = "📁";

const FOLDER_EMOJIS = [
    "📁", "📂", "⭐", "❤️", "🏠", "💼",
    "🎮", "🎵", "🎬", "📚", "🛒", "💻",
    "📰", "✈️", "🍔", "💰", "🎓", "🔧",
    "📷", "🌐", "🔥", "💡", "📌", "🧠"
];

// Desenha o ícone da pasta (emoji ou imagem) dentro do elemento
function renderFolderIcon(iconEl, folderData) {

    iconEl.textContent = "";
    iconEl.className = "folder-icon";

    if (folderData.icon && folderData.icon.startsWith("data:")) {
        const img = document.createElement("img");
        img.src = folderData.icon;
        img.alt = "";
        iconEl.appendChild(img);
    } else {
        iconEl.textContent = folderData.icon || DEFAULT_FOLDER_ICON;
    }
}

// Seletor de ícone (um só, reaproveitado por todas as pastas)
const iconPicker = document.createElement("div");
iconPicker.id = "iconPicker";
iconPicker.style.display = "none";

const emojiGrid = document.createElement("div");
emojiGrid.className = "icon-picker-grid";

const importFolderIconButton = document.createElement("button");
importFolderIconButton.type = "button";
importFolderIconButton.className = "icon-picker-action";
importFolderIconButton.textContent = "🖼️ Importar imagem";

const resetFolderIconButton = document.createElement("button");
resetFolderIconButton.type = "button";
resetFolderIconButton.className = "icon-picker-action";
resetFolderIconButton.textContent = "↩️ Restaurar padrão (📁)";

const folderIconInput = document.createElement("input");
folderIconInput.type = "file";
folderIconInput.accept = "image/*";
folderIconInput.hidden = true;

let iconTarget = null; // { folderData, iconEl }

function closeIconPicker() {
    iconPicker.style.display = "none";
}

// value: emoji, dataURL de imagem, ou null para voltar ao padrão
function setFolderIcon(value) {

    if (!iconTarget) return;

    if (value) {
        iconTarget.folderData.icon = value;
    } else {
        delete iconTarget.folderData.icon;
    }

    renderFolderIcon(iconTarget.iconEl, iconTarget.folderData);
    saveData();
    closeIconPicker();
}

function openIconPicker(folderData, iconEl, anchor) {

    iconTarget = { folderData, iconEl };

    iconPicker.style.display = "block";

    const rect = anchor.getBoundingClientRect();
    const left = Math.max(8, rect.right + window.scrollX - iconPicker.offsetWidth);

    iconPicker.style.left = left + "px";
    iconPicker.style.top = (rect.bottom + window.scrollY + 6) + "px";
}

FOLDER_EMOJIS.forEach(emoji => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = emoji;
    btn.addEventListener("click", () => setFolderIcon(emoji));
    emojiGrid.appendChild(btn);
});

importFolderIconButton.addEventListener("click", () => folderIconInput.click());
resetFolderIconButton.addEventListener("click", () => setFolderIcon(null));

folderIconInput.addEventListener("change", function () {

    const file = this.files[0];
    if (!file || !iconTarget) return;

    const reader = new FileReader();

    reader.onload = async function (e) {
        try {
            const resized = await resizeImage(e.target.result, 64);
            setFolderIcon(resized);
        } catch {
            alert("Não foi possível carregar essa imagem.");
        }
    };

    reader.readAsDataURL(file);
    this.value = "";
});

iconPicker.addEventListener("click", e => e.stopPropagation());

iconPicker.appendChild(emojiGrid);
iconPicker.appendChild(importFolderIconButton);
iconPicker.appendChild(resetFolderIconButton);
iconPicker.appendChild(folderIconInput);
document.body.appendChild(iconPicker);

/* ============================================================
   Temas (ficam dentro do menu de configurações, junto do wallpaper)
   ============================================================ */

// Ordem das cores em cada tema (cada uma vira uma variável CSS --nome)
const THEME_KEYS = [
    "bg", "folder-bg", "folder-hover", "text", "text-muted",
    "accent", "accent-hover", "accent-text"
];

const THEMES = [
    { id: "midnight",    name: "Midnight",    colors: ["#121212", "#1E1E1E", "#292929", "#F5F5F5", "#A0A0A0", "#7C5CFF", "#947AFF", "#FFFFFF"] },
    { id: "purple-neon", name: "Purple Neon", colors: ["#100D17", "#1B1526", "#291E3A", "#F3EEFF", "#A99BBF", "#A855F7", "#C084FC", "#FFFFFF"] },
    { id: "cyber-blue",  name: "Cyber Blue",  colors: ["#0B1118", "#121D29", "#1B2B3B", "#E8F4FF", "#8EA4B8", "#38BDF8", "#67D5FF", "#0B1118"] },
    { id: "matrix",      name: "Matrix",      colors: ["#0B100D", "#121A14", "#1A271D", "#E7F5EA", "#91A895", "#4ADE80", "#86EFAC", "#0B100D"] },
    { id: "sunset",      name: "Sunset",      colors: ["#15100E", "#211814", "#30211A", "#FFF4ED", "#B9A196", "#FB923C", "#FDBA74", "#15100E"] },
    { id: "crimson",     name: "Crimson",     colors: ["#140B0D", "#211215", "#32191D", "#FFF0F1", "#B89A9E", "#F43F5E", "#FB7185", "#FFFFFF"] },
    { id: "arctic",      name: "Arctic",      colors: ["#0D1418", "#151F24", "#203039", "#EFFBFF", "#9BAEB5", "#22D3EE", "#67E8F9", "#0D1418"] },
    { id: "amber",       name: "Amber",       colors: ["#12110D", "#1E1B14", "#2C271B", "#FFF9E8", "#B7AC8C", "#F59E0B", "#FBBF24", "#12110D"] }
];

// Transforma o array de cores em { "bg": "...", "text": "...", ... }
function themeVars(theme) {
    const vars = {};
    THEME_KEYS.forEach((key, i) => { vars[key] = theme.colors[i]; });
    return vars;
}

const themeOptions = {}; // id -> botão (para marcar o tema ativo)

function applyTheme(id, save = true) {

    const theme = THEMES.find(t => t.id === id) || THEMES[0];
    const vars = themeVars(theme);

    Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty("--" + key, value);
    });

    Object.entries(themeOptions).forEach(([optionId, button]) => {
        button.classList.toggle("active", optionId === theme.id);
    });

    if (save) localStorage.setItem("theme", theme.id);
}

// Seção "Temas" dentro do menu de configurações
const themeSection = document.createElement("div");
themeSection.className = "theme-section";

const themeTitle = document.createElement("div");
themeTitle.className = "theme-title";
themeTitle.textContent = "🎨 Temas";

const themeGrid = document.createElement("div");
themeGrid.className = "theme-grid";

THEMES.forEach(theme => {

    const vars = themeVars(theme);

    const option = document.createElement("button");
    option.type = "button";
    option.className = "theme-option";

    // Bolinha de pré-visualização: fundo da pasta com borda na cor de destaque
    const dot = document.createElement("span");
    dot.className = "theme-dot";
    dot.style.background = vars["folder-bg"];
    dot.style.borderColor = vars["accent"];

    const label = document.createElement("span");
    label.textContent = theme.name;

    option.appendChild(dot);
    option.appendChild(label);

    option.addEventListener("click", () => applyTheme(theme.id));

    themeOptions[theme.id] = option;
    themeGrid.appendChild(option);
});

themeSection.appendChild(themeTitle);
themeSection.appendChild(themeGrid);

// Clicar num tema não fecha o menu (dá para testar vários)
themeSection.addEventListener("click", e => e.stopPropagation());

settingsMenu.appendChild(themeSection);

// Aplica o tema salvo (ou o padrão)
applyTheme(localStorage.getItem("theme"), false);

/* ============================================================
   Opacidade das pastas (vale para todas, junto do tema)
   ============================================================ */

const opacitySection = document.createElement("div");
opacitySection.className = "opacity-section";

const opacityTitle = document.createElement("div");
opacityTitle.className = "theme-title";
opacityTitle.textContent = "🌫️ Opacidade das pastas";

const opacityRow = document.createElement("div");
opacityRow.className = "opacity-row";

const opacityInput = document.createElement("input");
opacityInput.type = "range";
opacityInput.min = "20";
opacityInput.max = "100";
opacityInput.step = "5";

const opacityLabel = document.createElement("span");

opacityRow.appendChild(opacityInput);
opacityRow.appendChild(opacityLabel);

const resetOpacityButton = document.createElement("button");
resetOpacityButton.type = "button";
resetOpacityButton.textContent = "↩️ Restaurar opacidade";

function applyFolderOpacity(percent, save = true) {

    percent = Math.min(100, Math.max(20, Number(percent) || 100));

    document.documentElement.style.setProperty("--folder-alpha", percent + "%");

    opacityInput.value = percent;
    opacityLabel.textContent = percent + "%";

    if (save) localStorage.setItem("folderAlpha", percent);
}

opacityInput.addEventListener("input", () => applyFolderOpacity(opacityInput.value));
resetOpacityButton.addEventListener("click", () => applyFolderOpacity(100));

opacitySection.appendChild(opacityTitle);
opacitySection.appendChild(opacityRow);
opacitySection.appendChild(resetOpacityButton);

// Mexer na barra não fecha o menu
opacitySection.addEventListener("click", e => e.stopPropagation());

settingsMenu.appendChild(opacitySection);

applyFolderOpacity(localStorage.getItem("folderAlpha") ?? 100, false);

/* ============================================================
   Utilitários
   ============================================================ */

// Redimensiona uma imagem (dataURL) para um quadrado de "size" x "size" px
// e retorna uma Promise que resolve com o novo dataURL em PNG.
function resizeImage(dataUrl, size) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, size, size);

            resolve(canvas.toDataURL("image/png"));
        };

        img.onerror = reject;
        img.src = dataUrl;
    });
}

// Garante que a URL tenha protocolo (senão vira link relativo)
function normalizeUrl(url) {
    url = url.trim();
    return /^https?:\/\//i.test(url) ? url : "https://" + url;
}

// Array que guarda todas as pastas
let folders = [];

// Salva no localStorage
function saveData() {
    try {
        localStorage.setItem("folders", JSON.stringify(folders));
    } catch (err) {
        console.error(err);
        alert("Não foi possível salvar: armazenamento cheio.");
    }
}

// Fecha um menu de pasta (remove a classe e esconde via style)
function closeMenu(menu) {
    menu.classList.remove("show");
    menu.style.display = "none";

    // A pasta deixa de ficar acima das outras
    const folderEl = menu.closest(".folder");
    if (folderEl) folderEl.classList.remove("menu-open");

    document.body.classList.toggle(
        "has-open-menu",
        !!document.querySelector(".folder-menu.show")
    );
}

// Busca uma pasta pelo id
function findFolderById(id) {
    return folders.find(f => f.id === id);
}

// Busca um site pelo id em todas as pastas
function findSiteById(id) {
    for (const folder of folders) {
        const site = folder.sites.find(s => s.id === id);
        if (site) return site;
    }
    return null;
}

// Reconstrói o array folderData.sites de uma pasta com base na ordem
// atual dos <li> dentro da <ul> correspondente no DOM.
function rebuildFolderSites(listEl) {

    const folderId = listEl.dataset.folderId;
    const folderData = findFolderById(folderId);

    if (!folderData) return;

    const newSites = [];

    listEl.querySelectorAll("li").forEach(li => {
        const site = findSiteById(li.dataset.siteId);
        if (site) newSites.push(site);
    });

    folderData.sites = newSites;
}

// Retorna a URL do favicon padrão (buscado via DuckDuckGo) para um site
function getDefaultIconUrl(siteUrl) {
    try {
        return `https://icons.duckduckgo.com/ip3/${new URL(siteUrl).hostname}.ico`;
    } catch {
        return "";
    }
}

/* ============================================================
   Sites
   ============================================================ */

function createSiteItem(siteData, folderData, list) {

    if (!siteData.id) {
        siteData.id = crypto.randomUUID();
    }

    const li = document.createElement("li");
    li.dataset.siteId = siteData.id;

    const icon = document.createElement("img");

    if (siteData.icon) {
        // Ícone importado manualmente pelo usuário
        icon.src = siteData.icon;
    } else {
        icon.src = getDefaultIconUrl(siteData.url);
    }

    icon.width = 16;
    icon.height = 16;

    const link = document.createElement("a");
    link.href = siteData.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    // O ícone e o texto ficam DENTRO do link
    const nameSpan = document.createElement("span");
    nameSpan.textContent = siteData.name;

    link.appendChild(icon);
    link.appendChild(nameSpan);

    const siteContainer = document.createElement("div");
    siteContainer.appendChild(link);

    siteContainer.addEventListener("contextmenu", function (event) {

        event.preventDefault();
        event.stopPropagation();

        currentSite = {
            siteData,
            folderData,
            li,
            link,
            icon,
            nameSpan
        };

        contextMenu.style.left = event.pageX + "px";
        contextMenu.style.top = event.pageY + "px";
        contextMenu.style.display = "block";
    });

    li.appendChild(siteContainer);
    list.appendChild(li);
}

/* ============================================================
   Pastas
   ============================================================ */

// Cria visualmente uma pasta
function createFolder(folderData, targetColumn) {

    const folder = document.createElement("div");
    folder.dataset.id = folderData.id;
    folder.className = "folder";

    if (folderData.view === "grid") {
        folder.classList.add("grid-view");
    }

    // Cabeçalho
    const header = document.createElement("div");
    header.className = "folder-header";

    const title = document.createElement("h2");

    const folderIcon = document.createElement("span");
    renderFolderIcon(folderIcon, folderData);

    const folderName = document.createElement("span");
    folderName.textContent = folderData.name;

    title.appendChild(folderIcon);
    title.appendChild(folderName);

    const optionsButton = document.createElement("button");
    optionsButton.className = "folder-options";
    optionsButton.textContent = "⋮";

    const menu = document.createElement("div");
    menu.className = "folder-menu";
    menu.style.display = "none"; // escondido até clicar no ⋮

    const viewButton = document.createElement("button");
    viewButton.textContent = "Alternar visualização";

    // Conteúdo
    const content = document.createElement("div");
    content.style.display = "block";

    const list = document.createElement("ul");
    list.dataset.folderId = folderData.id;

    // "Adicionar site" fica sempre visível fora do menu.
    // Renomear/Remover ficam dentro do menu do ⋮.
    const addSiteButton = document.createElement("button");
    addSiteButton.textContent = "+ Adicionar site";

    const renameFolderButton = document.createElement("button");
    renameFolderButton.textContent = "Renomear pasta";

    const removeFolderButton = document.createElement("button");
    removeFolderButton.textContent = "Remover pasta";

    const changeIconButton = document.createElement("button");
    changeIconButton.textContent = "Alterar ícone";

    changeIconButton.addEventListener("click", function (event) {
        event.stopPropagation();
        closeMenu(menu);
        openIconPicker(folderData, folderIcon, optionsButton);
    });

    // Evento do botão de opções (abre/fecha o menu)
    optionsButton.addEventListener("click", function (e) {
        e.stopPropagation();

        // Fecha qualquer outro menu aberto antes de abrir este
        document.querySelectorAll(".folder-menu").forEach(m => {
            if (m !== menu) closeMenu(m);
        });

        const isOpen = menu.classList.contains("show");

        if (isOpen) {
            closeMenu(menu);
        } else {
            menu.classList.add("show");
            menu.style.display = "flex";

            // Pasta com menu aberto fica acima das outras e o hover das demais é desligado
            folder.classList.add("menu-open");
            document.body.classList.add("has-open-menu");
        }
    });

    // Carrega sites salvos
    folderData.sites.forEach(site => {
        createSiteItem(site, folderData, list);
    });

    // Adicionar site
    addSiteButton.addEventListener("click", function (event) {
        event.stopPropagation();

        const siteName = prompt("Nome do site:");
        if (!siteName || siteName.trim() === "") return;

        const siteURL = prompt("URL do site:");
        if (!siteURL || siteURL.trim() === "") return;

        const siteData = {
            id: crypto.randomUUID(),
            name: siteName.trim(),
            url: normalizeUrl(siteURL)
        };

        folderData.sites.push(siteData);
        createSiteItem(siteData, folderData, list);
        saveData();
    });

    // Renomear pasta
    renameFolderButton.addEventListener("click", function (event) {
        event.stopPropagation();

        const newName = prompt("Novo nome da pasta:", folderData.name);

        if (newName === null || newName.trim() === "") return;

        folderData.name = newName.trim();
        folderName.textContent = folderData.name;

        saveData();
        closeMenu(menu);
    });

    // Alternar visualização (lista / ícones)
    viewButton.addEventListener("click", function (event) {

        event.stopPropagation();

        folder.classList.toggle("grid-view");

        folderData.view = folder.classList.contains("grid-view")
            ? "grid"
            : "list";

        saveData();
        closeMenu(menu);
    });

    // Remover pasta
    removeFolderButton.addEventListener("click", function (event) {
        event.stopPropagation();

        const confirmar = confirm("Deseja remover esta pasta?");
        if (!confirmar) return;

        folder.remove();
        folders = folders.filter(f => f !== folderData);

        saveData();
        closeMenu(menu);
    });

    menu.appendChild(renameFolderButton);
    menu.appendChild(removeFolderButton);
    menu.appendChild(viewButton);
    menu.appendChild(changeIconButton);

    header.appendChild(title);
    header.appendChild(optionsButton);
    header.appendChild(menu);

    // Ordem dentro do conteúdo: primeiro os sites, depois o botão
    // de adicionar site (que fica sempre visível)
    content.appendChild(list);

    const actions = document.createElement("div");
    actions.className = "folder-actions";
    actions.appendChild(addSiteButton);

    content.appendChild(actions);

    folder.appendChild(header);
    folder.appendChild(content);

    // Define em qual coluna a pasta deve entrar
    let columnIndex;

    if (typeof targetColumn === "number") {
        columnIndex = targetColumn;
    } else if (typeof folderData.column === "number") {
        columnIndex = folderData.column;
    } else {
        columnIndex = nextColumn;
        nextColumn = (nextColumn + 1) % columns.length;
    }

    folderData.column = columnIndex;
    columns[columnIndex].appendChild(folder);

    // Permite arrastar os sites dentro da lista (reordenar e mover entre pastas)
    new Sortable(list, {
        group: "sites",
        animation: 150,
        ghostClass: "dragging-site",
        chosenClass: "chosen-site",
        dragClass: "drag-site",

        onEnd(evt) {
            rebuildFolderSites(evt.from);
            if (evt.to !== evt.from) {
                rebuildFolderSites(evt.to);
            }
            saveData();
        }
    });
}

// Criar nova pasta
addFolderButton.addEventListener("click", function () {

    const folderName = prompt("Digite o nome da pasta:");
    if (!folderName || folderName.trim() === "") return;

    const folderData = {
        id: crypto.randomUUID(),
        name: folderName.trim(),
        column: nextColumn,
        order: 0,
        sites: [],
        view: "list"
    };

    folders.push(folderData);
    saveData();

    createFolder(folderData, nextColumn);
    nextColumn = (nextColumn + 1) % columns.length;

    updateFolderPositions();
});

/* ============================================================
   Configurações e wallpaper
   ============================================================ */

settingsButton.addEventListener("click", function (e) {

    e.stopPropagation();

    settingsMenu.style.display =
        settingsMenu.style.display === "block" ? "none" : "block";
});

changeWallpaper.addEventListener("click", function () {

    wallpaperInput.click();
    settingsMenu.style.display = "none";
});

resetWallpaper.addEventListener("click", function () {

    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundAttachment = "";

    localStorage.removeItem("wallpaper");

    settingsMenu.style.display = "none";
});

wallpaperInput.addEventListener("change", function () {

    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        document.body.style.backgroundImage = `url(${e.target.result})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundAttachment = "fixed";

        localStorage.setItem("wallpaper", e.target.result);
    };

    reader.readAsDataURL(file);
});

/* ============================================================
   Ícones dos sites
   ============================================================ */

// Importar ícone (menu de contexto do site, clique com botão direito)
importIconOption.addEventListener("click", function () {

    if (!currentSite) return;

    // Abre o seletor de arquivo; o site alvo já está guardado em currentSite
    faviconInput.click();

    contextMenu.style.display = "none";
});

// Restaurar ícone padrão (menu de contexto do site)
restoreIconOption.addEventListener("click", function () {

    if (!currentSite) return;

    // Remove o ícone customizado salvo
    delete currentSite.siteData.icon;

    // Volta a usar o ícone buscado automaticamente
    currentSite.icon.src = getDefaultIconUrl(currentSite.siteData.url);

    saveData();
    contextMenu.style.display = "none";
});

// Quando o usuário escolhe uma imagem, ela vira o ícone daquele site específico
faviconInput.addEventListener("change", function (event) {

    const file = event.target.files[0];
    if (!file || !currentSite) return;

    const reader = new FileReader();

    reader.onload = async function (e) {
        try {
            // Redimensiona para 32x32px antes de salvar (ícone leve e padronizado)
            const resized = await resizeImage(e.target.result, 32);

            currentSite.siteData.icon = resized;
            currentSite.icon.src = resized;

            saveData();
        } catch {
            alert("Não foi possível carregar essa imagem.");
        }
    };

    reader.readAsDataURL(file);

    // Limpa o input para permitir selecionar o mesmo arquivo novamente no futuro
    faviconInput.value = "";
});

/* ============================================================
   Carregamento inicial
   ============================================================ */

window.addEventListener("load", function () {

    const wallpaper = localStorage.getItem("wallpaper");

    if (wallpaper) {

        document.body.style.backgroundImage = `url(${wallpaper})`;
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundAttachment = "fixed";
    }

    const savedFolders = localStorage.getItem("folders");
    if (!savedFolders) return;

    folders = JSON.parse(savedFolders);

    folders.forEach(folder => {
        if (folder.column === undefined) folder.column = 0;
        if (folder.order === undefined) folder.order = 0;

        // Dados do antigo recurso de cor/opacidade por pasta (agora existem os temas)
        delete folder.folderColor;
        delete folder.folderOpacity;
    });

    const sortedFolders = [...folders].sort((a, b) => {
        const colA = a.column ?? 0;
        const colB = b.column ?? 0;

        if (colA !== colB) return colA - colB;
        return (a.order ?? 0) - (b.order ?? 0);
    });

    sortedFolders.forEach(folder => {
        createFolder(folder, folder.column);
    });

    if (folders.length > 0) {
        nextColumn = folders.length % columns.length;
    }
});

// Fechar menus ao clicar fora
document.addEventListener("click", function () {

    contextMenu.style.display = "none";
    settingsMenu.style.display = "none";
    closeIconPicker();

    document.querySelectorAll(".folder-menu").forEach(menu => {
        closeMenu(menu);
    });
});

/* ============================================================
   Menu de contexto do site: editar / remover
   ============================================================ */

editOption.addEventListener("click", function () {

    if (!currentSite) return;

    const newName = prompt("Novo nome:", currentSite.siteData.name);
    if (newName === null || newName.trim() === "") return;

    const newURL = prompt("Nova URL:", currentSite.siteData.url);
    if (newURL === null || newURL.trim() === "") return;

    const finalURL = normalizeUrl(newURL);

    currentSite.siteData.name = newName.trim();
    currentSite.siteData.url = finalURL;

    // Atualiza só o texto (o ícone fica preservado dentro do link)
    currentSite.nameSpan.textContent = newName.trim();
    currentSite.link.href = finalURL;

    // Só atualiza o ícone automaticamente se o site não tiver um ícone importado
    if (!currentSite.siteData.icon) {
        currentSite.icon.src = getDefaultIconUrl(finalURL);
    }

    saveData();
    contextMenu.style.display = "none";
});

deleteOption.addEventListener("click", function () {

    if (!currentSite) return;

    currentSite.li.remove();

    currentSite.folderData.sites =
        currentSite.folderData.sites.filter(s => s !== currentSite.siteData);

    saveData();
    contextMenu.style.display = "none";
});

/* ============================================================
   Arrastar pastas entre colunas
   ============================================================ */

// Atualiza a coluna e a ordem de cada pasta com base na posição atual no DOM
function updateFolderPositions() {

    columns.forEach((column, columnIndex) => {

        const folderElements = column.querySelectorAll(".folder");

        folderElements.forEach((folderEl, orderIndex) => {

            const folderData = folders.find(f => f.id === folderEl.dataset.id);
            if (!folderData) return;

            folderData.column = columnIndex;
            folderData.order = orderIndex;
        });
    });

    saveData();
}

document.querySelectorAll(".column").forEach(column => {

    new Sortable(column, {
        group: "folders",
        animation: 200,
        filter: ".folder-menu, button, input",
        preventOnFilter: false, // sem isso o slider e os botões deixam de funcionar
        ghostClass: "dragging",
        chosenClass: "chosen",
        dragClass: "drag",

        onEnd() {
            updateFolderPositions();
        }
    });
});

// Backup
const exportBackup = document.getElementById("exportBackup");
const importBackup = document.getElementById("importBackup");

const backupInput = document.createElement("input");
backupInput.type = "file";
backupInput.accept = ".json";
backupInput.hidden = true;

document.body.appendChild(backupInput);


// Exportar backup
exportBackup.addEventListener("click", function () {

    const backup = {
        folders: folders,
        wallpaper: localStorage.getItem("wallpaper")
    };

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "helpfy-backup.json";
    link.click();

    URL.revokeObjectURL(url);
});


// Importar backup
importBackup.addEventListener("click", function () {
    backupInput.click();
});

backupInput.addEventListener("change", function () {

    const file = backupInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {

        try {
            const backup = JSON.parse(event.target.result);

            if (!Array.isArray(backup.folders)) {
                throw new Error("Backup inválido");
            }

            const confirmar = confirm(
                "Importar este backup substituirá suas pastas atuais. Continuar?"
            );

            if (!confirmar) return;

            folders = backup.folders;

            if (backup.wallpaper) {
                localStorage.setItem("wallpaper", backup.wallpaper);
            } else {
                localStorage.removeItem("wallpaper");
            }

            saveData();

            location.reload();

        } catch (error) {
            alert("Não foi possível importar esse backup.");
        }
    };

    reader.readAsText(file);
    backupInput.value = "";
});