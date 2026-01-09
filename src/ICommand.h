#ifndef ICOMMAND_H
#define ICOMMAND_H

#include <string>
#include "InputChecker.h"

using namespace std;

// Interface for the commands we will Create
class ICommand {
public:
    virtual bool execute(const InputChecker& ic, string& response) = 0;
    virtual ~ICommand() = default;
};

#endif