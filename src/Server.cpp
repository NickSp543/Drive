#include <iostream>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <map>
#include <cstring>
#include <vector>
#include "InputChecker.h"
#include "AddCommand.h"
#include "GetCommand.h"
#include "SearchCommand.h"
#include "DeleteCommand.h"
#include <mutex>
#include "ThreadPool.h"

using namespace std;

mutex compressor_mutex; // Mutex to protect shared Compressor data

void handleClient(int client_socket) {
    // Create map and assign commands
    map<string, ICommand*> commands;
    ICommand* post = new AddCommand();
    commands["post"] = post;
    ICommand* get = new GetCommand();
    commands["get"] = get;
    ICommand* search = new SearchCommand();
    commands["search"] = search;
    ICommand* deletef = new DeleteCommand();
    commands["delete"] = deletef;

    char buffer[4096];
    
    while (true) {
        memset(buffer, 0, sizeof(buffer));
        int bytes_received = recv(client_socket, buffer, sizeof(buffer) - 1, 0);
        
        if (bytes_received <= 0) {
            // Client disconnected or error
            break;
        }
        
        string input(buffer);
        // Remove trailing newline if exists
        if (!input.empty() && input[input.length() - 1] == '\n') {
            input.erase(input.length() - 1);
        }
        
        InputChecker ic;
        string response = "400 Bad Request\n";
        
        if (ic.isValidCommand(input)) {
            try {
                // Lock mutex for shared data access
                lock_guard<mutex> lock(compressor_mutex);
                commands[ic.command]->execute(ic, response);
            }
            catch(...) {
                response = "500 Internal Server Error\n";
            }
        }
        
        // Send response back to client
        send(client_socket, response.c_str(), response.length(), 0);
    }
    
    // Cleanup
    delete post;
    delete get;
    delete search;
    delete deletef;
    close(client_socket);
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        cerr << "Usage: " << argv[0] << " <port>" << endl;
        return 1;
    }
    
    int port = atoi(argv[1]);
    
    // Load existing files
    Compressor::loadExistingFiles();
    
    // Create socket
    int server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket < 0) {
        cerr << "Error creating socket" << endl;
        return 1;
    }
    
    // Allow reuse of address
    int opt = 1;
    if (setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        cerr << "Error setting socket options" << endl;
        close(server_socket);
        return 1;
    }
    
    // Bind socket to port
    struct sockaddr_in server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(port);
    
    if (bind(server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        cerr << "Error binding socket" << endl;
        close(server_socket);
        return 1;
    }
    
    // Listen for connections
    if (listen(server_socket, 10) < 0) {
        cerr << "Error listening on socket" << endl;
        close(server_socket);
        return 1;
    }
    
    cout << "Server listening on port " << port << endl;
    
    // Create ThreadPool
    ThreadPool thread_pool(10);
    
    // Accept clients in a loop
    while (true) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        
        int client_socket = accept(server_socket, (struct sockaddr*)&client_addr, &client_len);
        
        if (client_socket < 0) {
            cerr << "Error accepting client" << endl;
            continue;
        }
        
        cout << "New client connected" << endl;
        
        // Add client handling task to thread pool
        thread_pool.enqueue([client_socket]() {
            handleClient(client_socket);
        });
    }
    
    close(server_socket);
    return 0;
}                       