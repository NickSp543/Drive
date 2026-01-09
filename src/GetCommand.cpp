#include "GetCommand.h"
#include <iostream>

using namespace std;

bool GetCommand::execute(const InputChecker& ic, string& response) {
    string output = Compressor::get(ic.filename);
    
    if (output.empty()) {
        response = "404 Not Found\n";
        return false;
    }

    response = "200 Ok\n\n" + output + "\n";
    return true;
}