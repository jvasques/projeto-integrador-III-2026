function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error(`Modal com ID ${modalId} não encontrado`);
    }
}

(function(){
    const LS_KEY = 'a11y:enabled';
    const LS_FONT = 'a11y:fontLarge';
    function applyState(){
        const root = document.documentElement;
        const enabled = localStorage.getItem(LS_KEY) === '1';
        const font = localStorage.getItem(LS_FONT) === '1';
        if(enabled) root.classList.add('a11y-high-contrast'); else root.classList.remove('a11y-high-contrast');
        if(font) root.classList.add('a11y-font-large'); else root.classList.remove('a11y-font-large');
        const btn = document.getElementById('a11y-toggle');
        if(btn) btn.setAttribute('aria-pressed', String(enabled || font));
    }
    function toggle(){
        const enabled = !(localStorage.getItem(LS_KEY) === '1');
        localStorage.setItem(LS_KEY, enabled ? '1' : '0');
        localStorage.setItem(LS_FONT, enabled ? '1' : '0');
        applyState();
    }
    window.applyA11yState = applyState;
    window.toggleA11y = toggle;
    try { applyState(); } catch(e) {}
})();

document.addEventListener('click', function(ev){
    const btn = ev.target && (ev.target.id === 'a11y-toggle' ? ev.target : (ev.target.closest && ev.target.closest('#a11y-toggle')));
    if(!btn) return;
    ev.preventDefault();
    if(window.toggleA11y){
        window.toggleA11y();
    } else {
        try {
            const r = document.documentElement;
            const on = !(r.classList.contains('a11y-high-contrast'));
            r.classList.toggle('a11y-high-contrast', on);
            r.classList.toggle('a11y-font-large', on);
            try{ localStorage.setItem('a11y:enabled', on?'1':'0'); localStorage.setItem('a11y:fontLarge', on?'1':'0'); }catch(e){}
            btn.setAttribute('aria-pressed', String(on));
        } catch(e) {}
    }
}, true);

function onlyDigits(str){ return (str||'').replace(/\D/g,''); }
function formatCPF(c){ c=onlyDigits(c).slice(0,11); if(c.length<=3) return c; if(c.length<=6) return c.slice(0,3)+'.'+c.slice(3); if(c.length<=9) return c.slice(0,3)+'.'+c.slice(3,6)+'.'+c.slice(6); return c.slice(0,3)+'.'+c.slice(3,6)+'.'+c.slice(6,9)+'-'+c.slice(9); }
function formatCNPJ(c){ c=onlyDigits(c).slice(0,14); if(c.length<=2) return c; if(c.length<=5) return c.slice(0,2)+'.'+c.slice(2); if(c.length<=8) return c.slice(0,2)+'.'+c.slice(2,5)+'.'+c.slice(5); if(c.length<=12) return c.slice(0,2)+'.'+c.slice(2,5)+'.'+c.slice(5,8)+'/'+c.slice(8); return c.slice(0,2)+'.'+c.slice(2,5)+'.'+c.slice(5,8)+'/'+c.slice(8,12)+'-'+c.slice(12); }
function formatCpfCnpj(val){ const d=onlyDigits(val); if(d.length>11) return formatCNPJ(d); return formatCPF(d); }

document.addEventListener('input', function(e){
    const id = e.target && (e.target.id || '');
    if(/telefone|cep|numero/i.test(id)) return;
    if(/documento|cnpj|cpf/i.test(id)){
        const old = e.target.value;
        const f = formatCpfCnpj(old);
        if(f !== old) e.target.value = f;
    }
});

function formatCEP(v){ v = onlyDigits(v).slice(0,8); if(v.length<=5) return v; return v.slice(0,5)+'-'+v.slice(5); }
function formatPhone(v){ v = onlyDigits(v).slice(0,11); if(v.length<=2) return v; if(v.length<=6) return '('+v.slice(0,2)+') '+v.slice(2); if(v.length<=10) return '('+v.slice(0,2)+') '+v.slice(2,6)+'-'+v.slice(6); return '('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7); }

document.addEventListener('input', function(e){
    const id = e.target && (e.target.id || '');
    if(/cep/i.test(id)){
        const val = e.target.value;
        const f = formatCEP(val);
        if(f !== val) e.target.value = f;
    }
    if(/telefone|phone/i.test(id)){
        const val = e.target.value;
        const f = formatPhone(val);
        if(f !== val) e.target.value = f;
    }
});

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error(`Modal com ID ${modalId} não encontrado`);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Acessibilidade: toggle alto contraste + fonte grande
    (function(){
        const btn = document.getElementById('a11y-toggle');
        const root = document.documentElement;
        const LS_KEY = 'a11y:enabled';
        const LS_FONT = 'a11y:fontLarge';
        function applyState(){
            const enabled = localStorage.getItem(LS_KEY) === '1';
            const font = localStorage.getItem(LS_FONT) === '1';
            if(enabled) root.classList.add('a11y-high-contrast'); else root.classList.remove('a11y-high-contrast');
            if(font) root.classList.add('a11y-font-large'); else root.classList.remove('a11y-font-large');
            if(btn) btn.setAttribute('aria-pressed', String(enabled || font));
        }
        function toggle(){
            const enabled = !(localStorage.getItem(LS_KEY) === '1');
            localStorage.setItem(LS_KEY, enabled ? '1' : '0');
            localStorage.setItem(LS_FONT, enabled ? '1' : '0');
            applyState();
        }
        applyState();
        if(btn){
            btn.addEventListener('click', toggle);
            btn.addEventListener('keydown', (e) => {
                if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
            });
        }
    })();

    const editSaveButton = document.getElementById('edit-save-button');
    const form = document.getElementById('empresa-form');
    let isEditing = false;

    if (editSaveButton) {
        editSaveButton.addEventListener('click', function() {
            if (!isEditing) {
                const inputs = form.querySelectorAll('input[readonly]');
                inputs.forEach(input => input.removeAttribute('readonly'));
                editSaveButton.textContent = 'Salvar';
                editSaveButton.classList.remove('btn-primary');
                editSaveButton.classList.add('btn-success');
                isEditing = true;
            } else {
                form.submit();
            }
        });
    }

    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('change-password-id').value;
            const password = document.getElementById('new-password').value;
            fetch(`/usuarios/update/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'password': password
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert(data.success);
                    closeModal('change-password-modal');
                    location.reload();
                }
            })
            .catch(error => {
                console.error('Erro ao alterar senha:', error);
                alert('Ocorreu um erro ao alterar a senha. Verifique o console para detalhes.');
            });
        });
    }
});

function openChangePasswordModal(id) {
    document.getElementById('change-password-id').value = id;
    openModal('change-password-modal');
}

function deleteUsuario(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    const container = document.createElement('div');
    container.innerHTML = `
        <div id="senhaPromptBackdrop" style="position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1999;"></div>
        <div id="senhaPrompt" role="dialog" aria-modal="true" aria-labelledby="senhaPromptTitle" style="position:fixed; top:40%; left:50%; transform:translate(-50%, -50%); background:white; border:1px solid #ccc; padding:20px; z-index:2000; width:90%; max-width:420px; border-radius:8px; box-shadow:0 6px 24px rgba(0,0,0,0.25);">
            <h3 id="senhaPromptTitle" style="margin:0 0 10px; font-size:1.1rem;">Confirmar exclusão</h3>
            <label style="display:block; margin-bottom:10px;">Informe a senha atual:
                <input type="password" id="senhaInput" style="width:100%; margin-top:6px; padding:8px 10px; border-radius:6px; border:1px solid #ccc;" autofocus>
            </label>
            <div style="margin-top:10px; text-align:right; display:flex; gap:8px; justify-content:flex-end;">
                <button type="button" id="cancelarBtn" class="btn btn-secondary">Cancelar</button>
                <button type="button" id="confirmarBtn" class="btn btn-danger">Confirmar</button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    const closePrompt = () => container.remove();
    document.getElementById('cancelarBtn').onclick = closePrompt;
    const backdropEl = document.getElementById('senhaPromptBackdrop');
    if(backdropEl){ backdropEl.addEventListener('click', closePrompt); }

    document.getElementById('confirmarBtn').onclick = async () => {
        const pw = document.getElementById('senhaInput').value;
        if (!pw) {
            alert('Senha não informada.');
            return;
        }
        closePrompt();

        const form = new URLSearchParams();
        form.append('current_password', pw);

        try {
            const response = await fetch(`/usuarios/delete/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: form.toString()
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                alert(data.error || 'Erro ao excluir usuário');
                return;
            }

            alert(data.success || 'Usuário excluído com sucesso');
            location.reload();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário. Veja o console para detalhes.');
        }
    };
}

function editFornecedor(id) {
    fetch(`/fornecedores/edit/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao buscar fornecedor');
            return response.json();
        })
        .then(data => {
            document.getElementById('edit-fornecedor-id').value = data.id;
            document.getElementById('edit-cnpj-fornecedor').value = data.cnpj;
            document.getElementById('edit-razao_social').value = data.razao_social;
            document.getElementById('edit-nome_fantasia').value = data.nome_fantasia;
            document.getElementById('edit-rua').value = data.rua;
            document.getElementById('edit-numero').value = data.numero;
            document.getElementById('edit-complemento').value = data.complemento || '';
            document.getElementById('edit-cep-fornecedor').value = data.cep;
            document.getElementById('edit-bairro').value = data.bairro;
            document.getElementById('edit-cidade').value = data.cidade;
            document.getElementById('edit-estado').value = data.estado;
            document.getElementById('edit-telefone-fornecedor').value = data.telefone;
            document.getElementById('edit-representante').value = data.representante;
            openModal('edit-fornecedor-modal');
        })
        .catch(error => console.error('Erro ao editar fornecedor:', error));
}

function editLocal(id) {
    fetch(`/locais/edit/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Erro ao buscar local');
            return response.json();
        })
        .then(data => {
            document.getElementById('edit-local-id').value = data.id;
            document.getElementById('edit-local-nome').value = data.nome || '';
            document.getElementById('edit-local-descricao').value = data.descricao || '';
            openModal('edit-local-modal');
        })
        .catch(err => {
            console.error('Erro ao carregar local para edição:', err);
            alert('Erro ao carregar local. Veja o console para detalhes.');
        });
}

function deleteLocal(id) {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;
    fetch(`/locais/delete/${id}`, { method: 'POST' })
        .then(async response => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro desconhecido');
            alert(data.success);
            location.reload();
        })
        .catch(err => {
            console.error('Erro ao excluir local:', err);
            alert(err.message || 'Erro ao excluir local. Veja o console.');
        });
}

function deleteFornecedor(id) {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
        fetch(`/fornecedores/delete/${id}`, { method: 'POST' })
            .then(response => {
                return response.json().then(data => ({
                    status: response.status,
                    data: data
                }));
            })
            .then(result => {
                if (result.status !== 200) {
                    if(result.data.has_movimentacoes){
                        if(confirm(result.data.error + '\n\nDeseja inativar este fornecedor agora?')){
                            toggleFornecedor(id);
                        }
                        return;
                    }
                    throw new Error(result.data.error || 'Erro desconhecido ao excluir fornecedor');
                }
                alert(result.data.success);
                location.reload();
            })
            .catch(error => {
                alert(error.message);
                console.error('Erro ao excluir fornecedor:', error);
            });
    }
}

function toggleFornecedor(id) {
    fetch(`/fornecedores/toggle/${id}`, { method: 'POST' })
        .then(response => {
            return response.json().then(data => ({
                status: response.status,
                data: data
            }));
        })
        .then(result => {
            if (result.status !== 200) {
                throw new Error(result.data.error || 'Erro desconhecido');
            }
            alert(result.data.success);
            location.reload();
        })
        .catch(error => {
            alert(error.message);
            console.error('Erro ao alterar status do fornecedor:', error);
        });
}

function editProduto(id) {
    fetch(`/produtos/edit/${id}`)
        .then(async response => {
            const contentType = response.headers.get('content-type') || '';
            let payload = null;
            if (contentType.includes('application/json')) {
                payload = await response.json();
            } else {
                payload = await response.text();
            }
            if (!response.ok) {
                const msg = (payload && payload.error) ? payload.error : `Erro ao buscar produto (status ${response.status})`;
                console.error('Resposta inválida ao editar produto:', response.status, payload);
                alert(msg);
                return;
            }
            const data = payload;
            document.getElementById('edit-produto-id').value = data.id;
            document.getElementById('edit-descricao').value = data.descricao || '';
            document.getElementById('edit-estoque-minimo').value = data.estoque_minimo ?? '';
            openModal('edit-produto-modal');
        })
        .catch(error => {
            console.error('Erro ao editar produto:', error);
            alert('Erro ao buscar produto. Veja o console para detalhes.');
        });
}

function showDetails(id){
    fetch(`/produtos/details/${id}`)
        .then(response => {
            if(!response.ok) throw new Error('Erro ao buscar detalhes');
            return response.json();
        })
        .then(data => {
            const container = document.getElementById('detalhes-conteudo');
            container.innerHTML = '';
            if(data.error){
                container.innerText = data.error;
            } else {
                const h = document.createElement('h4');
                h.textContent = `Produto: ${id} - ${data.descricao || 'Produto'}`;
                h.style.marginTop = '10px';
                container.appendChild(h);
                const table = document.createElement('table');
                table.className = 'table';
                const thead = document.createElement('thead');
                thead.innerHTML = '<tr><th>Local</th><th>Quantidade</th></tr>';
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                const positive = data.detalhes.filter(r => {
                    try { return parseInt(r.quantidade || 0) > 0 } catch(e){ return false }
                });
                if(positive.length === 0){
                    const tr = document.createElement('tr');
                    const td = document.createElement('td'); td.setAttribute('colspan', '2'); td.innerText = 'Sem estoque em nenhum local.';
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                } else {
                    positive.forEach(r => {
                        const tr = document.createElement('tr');
                        const tdLocal = document.createElement('td'); tdLocal.innerText = r.local || '';
                        const tdQty = document.createElement('td'); tdQty.innerText = r.quantidade || '';
                        tr.appendChild(tdLocal); tr.appendChild(tdQty);
                        tbody.appendChild(tr);
                    });
                }
                table.appendChild(tbody);
                container.appendChild(table);
            }
            openModal('produto-detalhes-modal');
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao carregar detalhes. Veja o console.');
        });
}

function deleteProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        fetch(`/produtos/delete/${id}`, { method: 'POST' })
            .then(response => {
                return response.json().then(data => ({
                    status: response.status,
                    data: data
                }));
            })
            .then(result => {
                if (result.status !== 200) {
                    alert(result.data.error || 'Erro desconhecido ao excluir produto');
                    return;
                }
                alert(result.data.success);
                location.reload();
            })
            .catch(error => {
                alert(error.message);
                console.error('Erro ao excluir produto:', error);
            });
    }
}

window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
};

document.addEventListener('DOMContentLoaded', function(){
    const transferForm = document.querySelector('#transfer-modal form');
    if(transferForm){
        transferForm.addEventListener('submit', function(e){
            const from = document.getElementById('transfer-local-from').value;
            const to = document.getElementById('transfer-local-to').value;
            const qtyInput = transferForm.querySelector('input[name="quantidade"]');
            const qty = parseInt((qtyInput && qtyInput.value) || '0', 10);
            const maxDisponivel = parseInt((qtyInput && qtyInput.max) || '0', 10);
            if(from === to){
                e.preventDefault();
                alert('Escolha estoques diferentes para origem e destino.');
                return false;
            }
            if(!qty || qty <= 0){
                e.preventDefault();
                alert('Informe uma quantidade válida (>0).');
                return false;
            }
            if(Number.isFinite(maxDisponivel) && maxDisponivel >= 0 && qty > maxDisponivel){
                e.preventDefault();
                alert(`Quantidade indisponível. Estoque na origem: ${maxDisponivel}.`);
                return false;
            }
            return true;
        });
    }

    // Guia Operacional
    (function(){
        const helpBtn = document.getElementById('help-toggle');
        if(!helpBtn) return;

        const route = (document.body.getAttribute('data-page') || '').toLowerCase();
        
        const tours = {
            '/empresa': [
                { sel: 'h1, h2', title: 'Dados da Empresa', text: 'Visão geral dos dados da sua empresa.' },
                { sel: '#cnpj-empresa', title: 'CNPJ', text: (document.body.getAttribute('data-role') === 'admin') ? 'Informe ou ajuste o CNPJ; se disponível, use a lupa para buscar os dados automaticamente.' : 'Informe ou ajuste o CNPJ.' },
                { sel: '#razao_social', title: 'Razão Social', text: 'Nome jurídico da empresa.' },
                { sel: '#nome_fantasia', title: 'Nome Fantasia', text: 'Como a empresa é conhecida publicamente.' },
                { sel: '#rua', title: 'Logradouro', text: 'Rua/Avenida do endereço da empresa.' },
                { sel: '#numero', title: 'Número', text: 'Número do endereço. Se não houver, deixe vazio.' },
                { sel: '#complemento', title: 'Complemento', text: 'Sala, bloco, conjunto ou outras referências.' },
                { sel: '#cep-empresa', title: 'CEP', text: 'Código Postal do endereço.' },
                { sel: '#bairro', title: 'Bairro', text: 'Bairro do endereço.' },
                { sel: '#cidade', title: 'Cidade', text: 'Cidade do endereço.' },
                { sel: '#estado', title: 'Estado', text: 'UF do endereço.' },
                { sel: '#telefone-empresa', title: 'Telefone', text: 'Telefone de contato da empresa.' }
            ],
            '/': [
                { sel: 'h1, h2', title: 'Dados da Empresa', text: 'Visão geral dos dados da sua empresa.' },
                { sel: '#cnpj-empresa', title: 'CNPJ', text: (document.body.getAttribute('data-role') === 'admin') ? 'Informe ou ajuste o CNPJ; se disponível, use a lupa para buscar os dados automaticamente.' : 'CNPJ da Empresa.' },
                { sel: '#razao_social', title: 'Razão Social', text: 'Nome jurídico da empresa.' },
                { sel: '#nome_fantasia', title: 'Nome Fantasia', text: 'Como a empresa é conhecida publicamente.' },
                { sel: '#rua', title: 'Logradouro', text: 'Rua/Avenida do endereço da empresa.' },
                { sel: '#numero', title: 'Número', text: 'Número do endereço. Se não houver, deixe vazio.' },
                { sel: '#complemento', title: 'Complemento', text: 'Sala, bloco, conjunto ou outras referências.' },
                { sel: '#cep-empresa', title: 'CEP', text: 'Código Postal do endereço.' },
                { sel: '#bairro', title: 'Bairro', text: 'Bairro do endereço.' },
                { sel: '#cidade', title: 'Cidade', text: 'Cidade do endereço.' },
                { sel: '#estado', title: 'Estado', text: 'UF do endereço.' },
                { sel: '#telefone-empresa', title: 'Telefone', text: 'Telefone de contato da empresa.' }
            ],
            '/fornecedores': [
                { sel: '.add-fornecedor', title: 'Adicionar Fornecedor', text: 'Abra o formulário para cadastrar um novo fornecedor.' },
                { sel: 'table.table', title: 'Lista de Fornecedores', text: 'Veja os fornecedores cadastrados e use as ações para editar ou excluir.' },
                { sel: '.btn-edit', title: 'Editar', text: 'Clique para editar os dados do fornecedor.' },
                { sel: '.btn-delete', title: 'Excluir', text: 'Clique para excluir o fornecedor selecionado.' }
            ],
            '/clientes': [
                { sel: '.add-cliente', title: 'Adicionar Cliente', text: 'Abra o formulário para cadastrar um novo cliente.' },
                { sel: 'table.table', title: 'Lista de Clientes', text: 'Veja os clientes cadastrados e utilize as ações.' }
            ],
            '/produtos': [
                { sel: '.add-produtos', title: 'Adicionar Produto', text: 'Gerencie produtos e detalhes.' },
                { sel: 'table.table', title: 'Estoque', text: 'Acompanhe quantidades por item.' }
            ],
            '/locais': [
                { sel: '.add-locais', title: 'Adicionar Local', text: 'Cadastre novos locais de estoque.' },
                { sel: 'table.table', title: 'Locais', text: 'Gerencie os locais existentes.' }
            ],
            '/movimentacoes': [
                { sel: '.mov', title: 'Ações de Movimentação', text: 'Registre entradas/saídas, devoluções, transferência e gere relatórios'},
                { sel: 'form, .card, .container', title: 'Filtros e Lançamentos', text: 'Defina filtros para visualizar as movimentações.' },
                { sel: 'table.table', title: 'Histórico', text: 'Acompanhe as movimentações realizadas.' }
            ],
            '/dashboard/reposicoes': [
                { sel: 'h1, h2', title: 'Análise Preditiva', text: 'Veja recomendações de reposição com base no histórico e no estoque mínimo.' },
                { sel: '#periodo', title: 'Janela Histórica', text: 'Ajuste o período para recalcular as métricas preditivas.' },
                { sel: '.card .table, table.table', title: 'Sugestão de Compra', text: 'Confira saldo atual, estoque ideal e sugestão de compra por produto.' },
                { sel: 'a[aria-controls="mobileDadosCollapse"], a[href="/dashboard/reposicoes"]', title: 'Botão Dados', text: 'No mobile, use o botão Dados para abrir Dashboard e Análise Preditiva.' }
            ],
            '/dashboard': [
                { sel: 'h1, h2', title: 'Dashboard', text: 'Acompanhe indicadores, gráficos e rankings de movimentação.' },
                { sel: '#periodo', title: 'Filtro de Período', text: 'Selecione a janela de análise para atualizar os números.' },
                { sel: '#chartMovimentacaoMensal, #chartMovimentacaoLocal', title: 'Gráficos', text: 'Visualize tendência de entradas/saídas e distribuição por local.' },
                { sel: 'table.table', title: 'Rankings', text: 'Consulte os principais produtos, clientes, fornecedores e saldos.' },
                { sel: 'a[aria-controls="mobileDadosCollapse"], a[href="/dashboard"]', title: 'Botão Dados', text: 'No mobile, use o botão Dados para navegar entre Dashboard e Análise Preditiva.' }
            ],
            '/usuarios': [
                { sel: '.add-usuario', title: 'Adicionar Usuário', text: 'Cadastre novos usuários do sistema.' },
                { sel: 'table.table', title: 'Usuários', text: 'Edite, redefina senha ou exclua usuários.' }
            ]
        };

        function pickSteps(){
            const keys = Object.keys(tours).sort((a,b)=> b.length - a.length);
            for(const k of keys){
                if(route.startsWith(k)) return tours[k];
            }
            return null;
        }

        function getRect(el){
            const r = el.getBoundingClientRect();
            return { top: r.top, left: r.left, width: r.width, height: r.height };
        }

        function createEl(tag, cls){ const e = document.createElement(tag); if(cls) e.className = cls; return e; }

        function isVisible(el){
            if(!el) return false;
            const style = window.getComputedStyle(el);
            if(style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        }

        function pickBestVisible(sel){
            const list = Array.from(document.querySelectorAll(sel)).filter(isVisible);
            if(list.length === 0) return null;
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            let best = list[0];
            let bestD = Infinity;
            for(const el of list){
                const r = el.getBoundingClientRect();
                const mx = r.left + r.width/2;
                const my = r.top + r.height/2;
                const d = Math.hypot(mx - cx, my - cy);
                if(d < bestD){ bestD = d; best = el; }
            }
            return best;
        }

        function placeTooltip(tt, rect){
            const margin = 12;
            let top = rect.top + rect.height + margin;
            let left = rect.left;
            const maxW = Math.min(480, window.innerWidth - 32);
            tt.style.maxWidth = maxW + 'px';
            const idealLeft = rect.left + (rect.width/2) - (maxW/2);
            left = Math.max(16, Math.min(idealLeft, window.innerWidth - maxW - 16));
            requestAnimationFrame(()=>{
                const ttRect = tt.getBoundingClientRect();
                const bottom = top + ttRect.height;
                if(bottom > window.innerHeight - 16){
                    top = Math.max(16, rect.top - ttRect.height - margin);
                }
                tt.style.top = top + 'px';
                tt.style.left = left + 'px';
            });
        }

        function scrollIntoViewIfNeeded(rect, el){
            const pad = 96;
            const topOk = rect.top >= pad;
            const bottomOk = (rect.top + rect.height) <= (window.innerHeight - pad);
            if(!topOk || !bottomOk){
                try{ el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); }
                catch(_){ window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - pad), behavior:'smooth' }); }
            }
        }

        let TOUR_ACTIVE = false;
        function startTour(steps){
            if(TOUR_ACTIVE) return;
            TOUR_ACTIVE = true;
            let idx = 0;
            let hole, tooltip;
            let keyHandler;

            function cleanup(){
                hole && hole.remove();
                tooltip && tooltip.remove();
                window.removeEventListener('resize', redraw);
                window.removeEventListener('scroll', redraw, true);
                document.removeEventListener('keydown', keyHandler, true);
                TOUR_ACTIVE = false;
            }

            function redraw(){
                const s = steps[idx];
                const el = s && pickBestVisible(s.sel);
                if(!el){ return; }
                const r = getRect(el);
                hole.style.top = (r.top - 8) + 'px';
                hole.style.left = (r.left - 8) + 'px';
                hole.style.width = (r.width + 16) + 'px';
                hole.style.height = (r.height + 16) + 'px';
                placeTooltip(tooltip, r);
            }

            function showStep(i){
                idx = i;
                const s = steps[idx];
                const el = s && pickBestVisible(s.sel);
                if(!el){ next(); return; }
                const r = getRect(el);
                scrollIntoViewIfNeeded(r, el);

                setTimeout(()=>{
                    if(!hole){
                        hole = createEl('div','tour-hole');
                        document.body.appendChild(hole);
                    }
                    if(!tooltip){
                        tooltip = createEl('div','tour-tooltip');
                        document.body.appendChild(tooltip);
                    }
                    tooltip.innerHTML = '';
                    const h3 = createEl('h3'); h3.textContent = s.title || 'Ajuda';
                    const p = createEl('p'); p.textContent = s.text || '';
                    const actions = createEl('div','tour-actions');
                    const btnPrev = createEl('button','btn btn-outline-secondary'); btnPrev.textContent = 'Voltar';
                    const btnNext = createEl('button','btn btn-primary'); btnNext.textContent = (idx < steps.length - 1) ? 'Próximo' : 'Concluir';
                    const btnClose = createEl('button','btn btn-link'); btnClose.textContent = 'Fechar';
                    btnPrev.disabled = idx === 0;
                    btnPrev.addEventListener('click', function(ev){ ev.stopPropagation(); prev(); });
                    btnNext.addEventListener('click', function(ev){ ev.stopPropagation(); next(); });
                    btnClose.addEventListener('click', function(ev){ ev.stopPropagation(); end(); });
                    actions.appendChild(btnPrev); actions.appendChild(btnNext); actions.appendChild(btnClose);
                    tooltip.appendChild(h3); tooltip.appendChild(p); tooltip.appendChild(actions);

                    redraw();

                    window.removeEventListener('resize', redraw);
                    window.removeEventListener('scroll', redraw, true);
                    window.addEventListener('resize', redraw);
                    window.addEventListener('scroll', redraw, true);
                }, 120);
            }

            function next(){ if(idx < steps.length - 1){ showStep(idx+1); } else { end(); } }
            function prev(){ if(idx > 0){ showStep(idx-1); } }
            function end(){ cleanup(); }

            keyHandler = function(e){
                if(e.key === 'Escape'){ e.preventDefault(); end(); }
                else if(e.key === 'ArrowRight'){ e.preventDefault(); next(); }
                else if(e.key === 'ArrowLeft'){ e.preventDefault(); prev(); }
            };
            document.addEventListener('keydown', keyHandler, true);

            showStep(0);
        }

        helpBtn.addEventListener('click', function(){
            const steps = pickSteps();
            if(!steps || steps.length === 0){
                alert('Guia desta página ainda não foi configurado.');
                return;
            }
            startTour(steps);
        });
    })();
});