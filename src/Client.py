import socket
import sys

def start_client(server_ip, port):
    try:
        client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client_socket.settimeout(30.0)
        client_socket.connect((server_ip, port))
    except Exception as e:
        sys.exit(1)
    
    try:
        while True:
            try:
                command = input()
            except EOFError:
                break
            
            try:
                client_socket.sendall((command + "\n").encode('utf-8'))
            except Exception:
                break
            
            response = ""
            while True:
                try:
                    data = client_socket.recv(4096)
                    if not data:
                        client_socket.close()
                        sys.exit(0)
                    
                    response += data.decode('utf-8')
                    
                    if '\n' in response:
                        break
                except socket.timeout:
                    client_socket.close()
                    sys.exit(1)
                except Exception:
                    client_socket.close()
                    sys.exit(1)
            
            print(response.rstrip('\n'))
    
    finally:
        client_socket.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(1)
    
    server_ip = sys.argv[1]
    port = int(sys.argv[2])
    
    start_client(server_ip, port)