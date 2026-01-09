#include "DeleteCommand.h"
#include <iostream>

using namespace std;

bool DeleteCommand::execute(const InputChecker& ic, string& response) {
    int result = Compressor::deletef(ic.filename); // attempt to delete the file
    
    switch (result) {
        case 0: // successful deletion
            response = "204 No Content\n";
            return true;
        case 1: // file not found
            response = "404 Not Found\n";
            return false;
        default: // error
            response = "500 Internal Server Error\n";
            return false;
    }
}