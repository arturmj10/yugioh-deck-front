// src/components/ProdutoList.jsx

function ProdutoList({ produtos, onEditar, onDeletar }) {
  if (produtos.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: '#888' }}>
        Nenhum produto cadastrado.
      </p>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Produtos Cadastrados</h2>
      <table style={styles.tabela}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Nome</th>
            <th style={styles.th}>Descrição</th>
            <th style={styles.th}>Preço</th>
            <th style={styles.th}>Qtd</th>
            <th style={styles.th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => (
            <tr key={produto.id}>
              <td style={styles.td}>{produto.id}</td>
              <td style={styles.td}>{produto.nome}</td>
              <td style={styles.td}>{produto.descricao || '-'}</td>
              <td style={styles.td}>R$ {produto.preco.toFixed(2)}</td>
              <td style={styles.td}>{produto.quantidade}</td>
              <td style={styles.td}>
                <button
                  onClick={() => onEditar(produto)}
                  style={styles.btnEditar}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDeletar(produto.id)}
                  style={styles.btnDeletar}
                >
                  Deletar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tabela: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  th: {
    backgroundColor: '#f8f9fa',
    padding: '12px 8px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    fontSize: '14px',
  },
  td: {
    padding: '10px 8px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
  },
  btnEditar: {
    padding: '6px 12px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '6px',
    fontSize: '13px',
  },
  btnDeletar: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};

export default ProdutoList;