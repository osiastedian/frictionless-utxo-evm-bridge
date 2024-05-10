
curl -X 'POST' \
    'https://rpc-tanenbaum.rollux.com' \
    -H 'Content-Type: application/json' \
    -d '{"jsonrpc": "2.0", "method": "eth_getBalance", "id": 1, "params": ["0x212bF37A387609218AB250Da6ca086966bc74D38", "latest"]}'


curl -X 'POST' \
  'https://rpc-tanenbaum.rollux.com' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc": "2.0", "method": "eth_gasPrice", "id": 1, "params": []}'