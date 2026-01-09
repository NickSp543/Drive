#include <iostream>
#include <sys/socket.h>
#include <stdio.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>
#include <netdb.h>

using namespace std;

int main(int argc, char* argv[]) {
    const char* host = argv[1];
    int port_no = atoi(argv[2]);

    hostent* he = gethostbyname(host); // support host names like localhost or docker containers
    if (!he) {
        cerr << "gethostbyname failed for " << host << endl;
        return 1;
    }

    // create socket
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        perror("error creating socket");
        return 1;
    }
    struct sockaddr_in sin;
    memset(&sin, 0, sizeof(sin));
    sin.sin_family = AF_INET;
    memcpy(&sin.sin_addr, he->h_addr_list[0], he->h_length);
    sin.sin_port = htons(port_no);

    // connect to server
    if (connect(sock, (struct sockaddr *) &sin, sizeof(sin)) < 0) {
        perror("error connecting to server");
        close(sock);
        return 1;
    }

    string input;
    char buffer[4096];
    while (true) {
        getline(cin, input);

        int sent_bytes = send(sock, input.c_str(), input.size(), 0); // send user input to server

        if (sent_bytes < 0) {
            // error
            break;
        }

        int read_bytes = recv(sock, buffer, sizeof(buffer), 0); // receive reasponse from the server
        if (read_bytes == 0) {
            cout << "Server closed connection." << endl;
            break;
        }
        else if (read_bytes < 0) {
            // error
            break;
        }
        else {
            // print and flush buffer
            cout.write(buffer, read_bytes);
            cout.flush();
        }
    }

    close(sock);
    return 0;
}